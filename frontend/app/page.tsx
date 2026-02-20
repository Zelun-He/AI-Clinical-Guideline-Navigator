"use client";

import { FormEvent, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

import RetrievedChunksPanel from "@/components/RetrievedChunksPanel";
import { askQuestion } from "@/lib/api";
import { AskResponse } from "@/types";

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const showCenteredSearch = useMemo(() => !result && !error, [result, error]);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      const response = await askQuestion(question.trim());
      setResult(response);
    } catch (searchError) {
      setError((searchError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
      <header className="mb-8 rounded-2xl wood-card px-6 py-4">
        <h1 className="text-2xl font-bold">AI Clinical Guideline Navigator</h1>
        <p className="mt-1 text-sm text-slate-700">
          Semantic search + grounded answers: natural-language query → embeddings → vector retrieval → citation-based response.
        </p>
      </header>

      <section className={`transition-all ${showCenteredSearch ? "my-auto" : "mb-6"}`}>
        <form onSubmit={handleSearch} className="mx-auto w-full max-w-4xl">
          <div className="wood-card flex items-center gap-3 rounded-full px-5 py-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-transparent text-lg outline-none placeholder:text-slate-500"
              placeholder="Ask any clinical question..."
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="wood-button rounded-full px-6 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
      </section>

      {error ? <p className="mb-4 rounded-xl bg-red-100 p-4 text-sm text-red-700">{error}</p> : null}

      {result ? (
        <section className="space-y-5">
          <article className="wood-card rounded-2xl p-6">
            <h2 className="mb-3 text-xl font-semibold">Grounded Answer</h2>
            <div className="prose max-w-none prose-slate">
              <ReactMarkdown>{result.answer}</ReactMarkdown>
            </div>

            <div className="mt-5">
              <h3 className="font-semibold">Citations</h3>
              <ul className="mt-1 list-inside list-disc text-sm">
                {result.citations.map((citation, index) => (
                  <li key={`${citation.source}-${citation.page_number}-${index}`}>
                    ({citation.source}, Page {citation.page_number})
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-3 text-sm text-slate-700">
              Retrieval confidence: {(result.confidence * 100).toFixed(1)}%
            </p>
          </article>

          <RetrievedChunksPanel chunks={result.retrieved_chunks} />
        </section>
      ) : null}

      <footer className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
        This tool is for informational purposes only and does not constitute medical advice.
      </footer>
    </div>
  );
}
