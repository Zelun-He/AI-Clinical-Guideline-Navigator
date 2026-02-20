"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";

import RetrievedChunksPanel from "@/components/RetrievedChunksPanel";
import { askQuestion } from "@/lib/api";
import { AskResponse } from "@/types";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      const response = await askQuestion(question);
      setResult(response);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Ask a Clinical Question</h1>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Example: What is the recommended first-line treatment for stage 1 hypertension?"
            className="min-h-28 w-full rounded border p-3"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Generating answer..." : "Ask"}
          </button>
        </form>
      </div>

      {error ? <p className="rounded bg-red-100 p-3 text-sm text-red-700">{error}</p> : null}

      {result && (
        <>
          <article className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Answer</h2>
            <div className="prose max-w-none">
              <ReactMarkdown>{result.answer}</ReactMarkdown>
            </div>

            <div>
              <h3 className="font-semibold">Citations</h3>
              <ul className="list-inside list-disc text-sm">
                {result.citations.map((citation, index) => (
                  <li key={`${citation.source}-${citation.page_number}-${index}`}>
                    ({citation.source}, Page {citation.page_number})
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-slate-600">
              Confidence score: {(result.confidence * 100).toFixed(1)}%
            </p>
          </article>

          <RetrievedChunksPanel chunks={result.retrieved_chunks} />
        </>
      )}

      <p className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
        This tool is for informational purposes only and does not constitute medical advice.
      </p>
    </section>
  );
}
