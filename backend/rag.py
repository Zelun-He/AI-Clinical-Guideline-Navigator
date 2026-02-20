import json
from typing import Any

from openai import AsyncOpenAI
from supabase import Client

from models import Citation, RetrievedChunk

EMBEDDING_MODEL = "text-embedding-3-large"
ANSWER_MODEL = "gpt-4.1-mini"

SYSTEM_PROMPT = (
    "You are a clinical guideline assistant. Use ONLY the provided context to answer "
    "the question. If the answer is not fully supported by the context, say you do not know."
)


async def retrieve_relevant_chunks(
    db: Client,
    client: AsyncOpenAI,
    query: str,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    embedding = (
        await client.embeddings.create(model=EMBEDDING_MODEL, input=query)
    ).data[0].embedding

    response = db.rpc(
        "match_guideline_chunks",
        {
            "query_embedding": embedding,
            "match_count": top_k,
        },
    ).execute()

    return response.data or []


def format_context(chunks: list[dict[str, Any]]) -> str:
    blocks = []
    for idx, chunk in enumerate(chunks, start=1):
        blocks.append(
            f"[{idx}] Source: {chunk['source']} | Page: {chunk['page_number']}\n"
            f"{chunk['content']}"
        )
    return "\n\n".join(blocks)


async def generate_grounded_answer(
    client: AsyncOpenAI,
    question: str,
    chunks: list[dict[str, Any]],
) -> str:
    context = format_context(chunks)
    user_prompt = (
        f"Context:\n{context}\n\n"
        f"Question:\n{question}\n\n"
        "Instructions:\n"
        "- Provide a clear answer\n"
        "- Cite sources in format (Source, Page X)\n"
        "- Do not use outside knowledge"
    )

    completion = await client.responses.create(
        model=ANSWER_MODEL,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    return completion.output_text.strip()


async def verify_grounding(
    client: AsyncOpenAI,
    answer: str,
    chunks: list[dict[str, Any]],
) -> bool:
    verifier_prompt = (
        "Context:\n"
        f"{format_context(chunks)}\n\n"
        f"Answer:\n{answer}\n\n"
        "Is the answer fully supported by context? Answer Yes or No only."
    )

    result = await client.responses.create(
        model=ANSWER_MODEL,
        input=[{"role": "user", "content": verifier_prompt}],
    )
    return result.output_text.strip().lower().startswith("yes")


def build_response_payload(
    answer: str,
    chunks: list[dict[str, Any]],
) -> dict[str, Any]:
    citations = [
        Citation(source=chunk["source"], page_number=chunk["page_number"]) for chunk in chunks
    ]
    retrieved = [
        RetrievedChunk(
            content=chunk["content"],
            source=chunk["source"],
            page_number=chunk["page_number"],
            similarity=float(chunk.get("similarity", 0.0)),
        )
        for chunk in chunks
    ]
    confidence = (
        sum(chunk.similarity for chunk in retrieved) / len(retrieved) if retrieved else 0.0
    )

    return {
        "answer": answer,
        "citations": [json.loads(c.model_dump_json()) for c in citations],
        "retrieved_chunks": [json.loads(r.model_dump_json()) for r in retrieved],
        "confidence": confidence,
    }
