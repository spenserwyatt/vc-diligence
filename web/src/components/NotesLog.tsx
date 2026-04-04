"use client";

import { useState, useEffect, useCallback } from "react";

interface NoteEntry {
  heading: string;
  body: string;
}

function parseNotes(raw: string): NoteEntry[] {
  if (!raw.trim()) return [];
  // Split on --- separators, then parse each chunk
  const chunks = raw.split(/\n---\n/).map((c) => c.trim()).filter(Boolean);
  return chunks.map((chunk) => {
    const lines = chunk.split("\n");
    const heading = lines[0]?.replace(/^##\s*/, "") || "Note";
    const body = lines.slice(1).join("\n").trim();
    return { heading, body };
  });
}

export function NotesLog({ dealName }: { dealName: string }) {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${dealName}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(parseNotes(data.content || ""));
      }
    } catch {}
    setLoading(false);
  }, [dealName]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function addNote() {
    if (!text.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/deals/${dealName}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), label: label.trim() }),
      });
      if (res.ok) {
        setText("");
        setLabel("");
        setShowForm(false);
        fetchNotes();
      }
    } catch {}
    setAdding(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy uppercase tracking-wide">
          Notes
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-blue hover:text-navy font-medium"
          >
            + Add Note
          </button>
        )}
      </div>

      {/* Add note form */}
      {showForm && (
        <div className="border border-blue/30 rounded-lg p-4 bg-blue/5 space-y-3">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Post-founder call, Initial review)"
            className="w-full px-3 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue/40"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Meeting notes, observations, action items..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue/40 resize-none"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowForm(false);
                setText("");
                setLabel("");
              }}
              className="px-3 py-1.5 text-xs text-muted hover:text-body"
            >
              Cancel
            </button>
            <button
              onClick={addNote}
              disabled={adding || !text.trim()}
              className="px-4 py-1.5 bg-navy text-white rounded text-xs font-medium hover:bg-blue transition-colors disabled:opacity-50"
            >
              {adding ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <p className="text-sm text-muted animate-pulse">Loading notes...</p>
      ) : notes.length === 0 && !showForm ? (
        <p className="text-sm text-muted py-4 text-center">
          No notes yet. Add meeting notes, observations, or action items.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note, i) => (
            <div
              key={i}
              className="border border-border rounded-lg p-4"
            >
              <div className="text-xs font-medium text-muted mb-2">
                {note.heading}
              </div>
              <div className="text-sm text-body whitespace-pre-wrap leading-relaxed">
                {note.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
