"use client";

import type { DealFile } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  source: "Source Documents",
  pipeline: "Pipeline Outputs",
  deliverable: "Deliverables",
  dataroom: "Data Room",
};

const categoryOrder = ["source", "pipeline", "deliverable", "dataroom"];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "📄";
    case "md":
      return "📝";
    case "html":
      return "🌐";
    case "docx":
      return "📋";
    case "xlsx":
    case "csv":
      return "📊";
    default:
      return "📎";
  }
}

export function FileList({
  files,
  dealName,
}: {
  files: DealFile[];
  dealName: string;
}) {
  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      files: files
        .filter((f) => f.category === cat)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.files.length > 0);

  if (grouped.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        No files yet. Upload source documents to get started.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-2">
            {group.label}
          </h3>
          <div className="bg-white rounded-lg border border-border divide-y divide-border">
            {group.files.map((file) => (
              <a
                key={file.name}
                href={`/api/deals/${dealName}/files/${encodeURIComponent(file.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="mr-3">{fileIcon(file.name)}</span>
                <span className="flex-1 text-sm font-medium text-body truncate">
                  {file.name}
                </span>
                <span className="text-xs text-muted ml-3">
                  {formatSize(file.size)}
                </span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
