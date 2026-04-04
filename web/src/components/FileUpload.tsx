"use client";

import { useState, useCallback } from "react";

export function FileUpload({
  dealName,
  onUploadComplete,
  label = "Drop files here or click to upload",
}: {
  dealName?: string;
  onUploadComplete?: () => void;
  label?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!dealName) return;
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        for (const file of Array.from(files)) {
          formData.append("files", file);
        }

        const res = await fetch(`/api/deals/${dealName}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        onUploadComplete?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [dealName, onUploadComplete]
  );

  return (
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
          uploadFiles(e.dataTransfer.files);
        }
      }}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = ".pdf,.docx,.xlsx,.csv,.pptx,.txt,.md";
        input.onchange = () => {
          if (input.files && input.files.length > 0) {
            uploadFiles(input.files);
          }
        };
        input.click();
      }}
    >
      {uploading ? (
        <p className="text-blue font-medium animate-pulse">Uploading...</p>
      ) : (
        <>
          <p className="text-muted">{label}</p>
          <p className="text-xs text-muted mt-1">
            PDF, DOCX, XLSX, CSV, PPTX
          </p>
        </>
      )}
      {error && <p className="text-vc-red text-sm mt-2">{error}</p>}
    </div>
  );
}
