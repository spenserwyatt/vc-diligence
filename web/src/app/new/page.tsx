"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewDealPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const slug = slugify(name);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Create the deal
      const formData = new FormData();
      formData.append("name", slug);
      formData.append("source", source);
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch("/api/deals", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create deal");
      }

      const data = await res.json();
      router.push(`/deals/${data.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-navy mb-6">New Deal</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company name */}
        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            Company / Fund Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Robotics"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/40"
            required
          />
          {slug && (
            <p className="text-xs text-muted mt-1">
              Folder: deals/{slug}/
            </p>
          )}
        </div>

        {/* Referral source */}
        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            Referral Source
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. John Smith, GP at XYZ Fund"
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/40"
          />
        </div>

        {/* File upload zone */}
        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            Source Documents
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragging
                ? "border-blue bg-blue/5"
                : "border-border hover:border-blue/40"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length > 0) {
                addFiles(e.dataTransfer.files);
              }
            }}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.multiple = true;
              input.accept = ".pdf,.docx,.xlsx,.csv,.pptx,.txt,.md";
              input.onchange = () => {
                if (input.files) addFiles(input.files);
              };
              input.click();
            }}
          >
            <p className="text-muted">
              Drop pitch deck and materials here, or click to browse
            </p>
            <p className="text-xs text-muted mt-1">
              PDF, DOCX, XLSX, CSV, PPTX
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-3 space-y-1">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm bg-white px-3 py-2 rounded border border-border"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiles((prev) => prev.filter((_, j) => j !== i));
                    }}
                    className="text-muted hover:text-vc-red ml-2 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-vc-red/10 border border-vc-red/20 rounded-lg text-sm text-vc-red">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="w-full py-2.5 px-4 bg-navy text-white rounded-lg font-medium hover:bg-blue transition-colors disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Deal"}
        </button>
      </form>
    </div>
  );
}
