# AI Clinical Guideline Navigator

A full-stack Retrieval-Augmented Generation (RAG) application for guideline-grounded clinical Q&A.

## Features

- Upload clinical guideline PDFs.
- Extract and chunk guideline text by page.
- Generate embeddings and store vectors in Supabase pgvector.
- Ask clinical questions and retrieve top matching chunks.
- Generate grounded answers with citations `(Source, Page X)`.
- View retrieved chunk context and similarity scores.
- Hallucination guard that returns `Insufficient evidence in provided guideline.` if answer is unsupported.

## Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS, React Markdown
- **Backend:** FastAPI, Pydantic, async endpoints
- **AI:** OpenAI embeddings + generation
- **Database:** Supabase Postgres + pgvector

## Project Structure

```text
backend/
  main.py
  ingest.py
  rag.py
  models.py
  requirements.txt
  schema.sql

frontend/
  app/
    upload/page.tsx
    ask/page.tsx
  components/
  lib/
```

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set environment variables:

```bash
export OPENAI_API_KEY="..."
export SUPABASE_URL="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
```

Run schema in Supabase SQL editor using `backend/schema.sql`.

Start API:

```bash
uvicorn main:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
npm install
export NEXT_PUBLIC_API_URL="http://localhost:8000"
npm run dev
```

Open:

- `http://localhost:3000/upload`
- `http://localhost:3000/ask`

## Disclaimer

This tool is for informational purposes only and does not constitute medical advice.
