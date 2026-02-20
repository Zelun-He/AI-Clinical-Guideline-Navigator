import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from supabase import create_client

from ingest import ingest_pdf
from models import AskRequest, AskResponse
from rag import build_response_payload, generate_grounded_answer, retrieve_relevant_chunks, verify_grounding

app = FastAPI(title="AI Clinical Guideline Navigator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
openai_client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])


@app.get("/health")
async def health_check() -> dict:
    return {"status": "ok"}


@app.post("/upload-guideline")
async def upload_guideline(file: UploadFile = File(...)) -> dict:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
        temp.write(await file.read())
        temp_path = temp.name

    try:
        chunk_count = await ingest_pdf(
            db=supabase,
            openai_client=openai_client,
            file_path=temp_path,
            source_name=Path(file.filename).name,
        )
    except Exception as exc:
        Path(temp_path).unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Failed to ingest PDF: {exc}") from exc

    return {
        "message": "Guideline uploaded and indexed successfully.",
        "source": file.filename,
        "chunks_indexed": chunk_count,
    }


@app.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest) -> AskResponse:
    chunks = await retrieve_relevant_chunks(
        db=supabase,
        client=openai_client,
        query=request.question,
        top_k=request.top_k,
    )
    if not chunks:
        raise HTTPException(status_code=404, detail="No relevant guideline chunks found.")

    answer = await generate_grounded_answer(openai_client, request.question, chunks)
    is_grounded = await verify_grounding(openai_client, answer, chunks)

    if not is_grounded:
        answer = "Insufficient evidence in provided guideline."

    payload = build_response_payload(answer, chunks)
    return AskResponse(**payload)
