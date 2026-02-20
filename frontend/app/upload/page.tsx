"use client";

import { FormEvent, useState } from "react";

import { uploadGuideline } from "@/lib/api";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setStatus("Please select a PDF before uploading.");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading and indexing guideline...");
    try {
      const result = await uploadGuideline(file);
      setStatus(`${result.message} Indexed chunks: ${result.chunks_indexed}.`);
    } catch (error) {
      setStatus(`Upload failed: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Upload Clinical Guidelines</h1>
      <p className="text-sm text-slate-600">
        Upload guideline PDFs to build the retrieval index used for grounded clinical Q&A.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full rounded border p-2"
        />
        <button
          type="submit"
          disabled={isUploading}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Upload PDF"}
        </button>
      </form>

      {status ? <p className="rounded bg-slate-100 p-3 text-sm">{status}</p> : null}

      <p className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
        This tool is for informational purposes only and does not constitute medical advice.
      </p>
    </section>
  );
}
