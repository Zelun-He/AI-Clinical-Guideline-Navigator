export type Citation = {
  source: string;
  page_number: number;
};

export type RetrievedChunk = {
  content: string;
  source: string;
  page_number: number;
  similarity: number;
};

export type AskResponse = {
  answer: string;
  citations: Citation[];
  confidence: number;
  retrieved_chunks: RetrievedChunk[];
};
