import re
from pathlib import Path

import pdfplumber
import tiktoken
from openai import AsyncOpenAI
from supabase import Client

EMBEDDING_MODEL = "text-embedding-3-large"


async def extract_text_from_pdf(file_path: str) -> list[dict]:
    """Extract text page-by-page from PDF."""
    pages: list[dict] = []
    with pdfplumber.open(file_path) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            raw_text = page.extract_text() or ""
            cleaned = re.sub(r"\s+", " ", raw_text).strip()
            if cleaned:
                pages.append({"page_number": page_index, "text": cleaned})
    return pages


def chunk_text(text: str, chunk_size: int = 700, overlap: int = 120) -> list[str]:
    """Chunk by approximate token count using tiktoken."""
    encoder = tiktoken.get_encoding("cl100k_base")
    token_ids = encoder.encode(text)

    if len(token_ids) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(token_ids):
        end = start + chunk_size
        window = token_ids[start:end]
        chunks.append(encoder.decode(window))
        if end >= len(token_ids):
            break
        start = max(end - overlap, 0)

    return [chunk.strip() for chunk in chunks if chunk.strip()]


async def generate_embedding(client: AsyncOpenAI, text: str) -> list[float]:
    response = await client.embeddings.create(model=EMBEDDING_MODEL, input=text)
    return response.data[0].embedding


async def store_chunk_in_db(
    db: Client,
    content: str,
    embedding: list[float],
    source: str,
    page_number: int,
) -> None:
    db.table("guideline_chunks").insert(
        {
            "content": content,
            "embedding": embedding,
            "source": source,
            "page_number": page_number,
        }
    ).execute()


async def ingest_pdf(
    db: Client,
    openai_client: AsyncOpenAI,
    file_path: str,
    source_name: str,
) -> int:
    pages = await extract_text_from_pdf(file_path)
    total_chunks = 0

    for page in pages:
        chunks = chunk_text(page["text"])
        for chunk in chunks:
            embedding = await generate_embedding(openai_client, chunk)
            await store_chunk_in_db(
                db=db,
                content=chunk,
                embedding=embedding,
                source=source_name,
                page_number=page["page_number"],
            )
            total_chunks += 1

    Path(file_path).unlink(missing_ok=True)
    return total_chunks
