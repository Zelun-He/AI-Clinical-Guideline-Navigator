"use client";

import { useState } from "react";

import { RetrievedChunk } from "@/types";

export default function RetrievedChunksPanel({ chunks }: { chunks: RetrievedChunk[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="wood-card rounded-2xl border">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-5 py-4 text-left font-semibold"
      >
        {isOpen ? "Hide" : "Show"} retrieved semantic chunks ({chunks.length})
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-amber-200 p-4">
          {chunks.map((chunk, index) => (
            <article key={`${chunk.source}-${chunk.page_number}-${index}`} className="rounded-lg bg-white/80 p-3 text-sm">
              <p className="mb-2 font-medium">
                {chunk.source}, Page {chunk.page_number} · Similarity: {(chunk.similarity * 100).toFixed(1)}%
              </p>
              <p className="whitespace-pre-wrap text-slate-700">{chunk.content}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
