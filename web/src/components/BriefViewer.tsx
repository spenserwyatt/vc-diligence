"use client";

export function BriefViewer({
  html,
  dealName,
}: {
  html: string;
  dealName: string;
}) {
  function exportPdf() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    // Give it a moment to render, then trigger print dialog
    setTimeout(() => win.print(), 500);
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={exportPdf}
          className="text-sm px-3 py-1.5 bg-navy text-white rounded hover:bg-blue transition-colors"
        >
          Export PDF
        </button>
      </div>
      <iframe
        srcDoc={html}
        className="w-full border-0 rounded-lg bg-white"
        style={{ minHeight: "80vh" }}
        title="Executive Brief"
        />
    </div>
  );
}
