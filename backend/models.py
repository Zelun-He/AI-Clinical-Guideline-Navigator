from pydantic import BaseModel, Field


class Citation(BaseModel):
    source: str
    page_number: int = Field(..., ge=1)


class RetrievedChunk(BaseModel):
    content: str
    source: str
    page_number: int = Field(..., ge=1)
    similarity: float


class AskRequest(BaseModel):
    question: str = Field(..., min_length=3)
    top_k: int = Field(default=5, ge=1, le=20)


class AskResponse(BaseModel):
    answer: str
    citations: list[Citation]
    retrieved_chunks: list[RetrievedChunk]
    confidence: float = Field(..., ge=0.0, le=1.0)
