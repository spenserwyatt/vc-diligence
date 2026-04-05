"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```[\s\S]*?```/g, (m) =>
      `<pre style="background:#f3f4f6;padding:8px 12px;border-radius:4px;overflow-x:auto;font-size:12px;margin:8px 0">${m.slice(3, -3).replace(/^\w*\n/, "")}</pre>`
    )
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Headers
    .replace(/^### (.+)$/gm, '<div style="font-weight:600;margin-top:12px;margin-bottom:4px">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-weight:700;font-size:15px;margin-top:14px;margin-bottom:6px">$1</div>')
    // Bullet lists
    .replace(/^[-*] (.+)$/gm, '<div style="padding-left:16px;text-indent:-10px;margin:2px 0">&bull; $1</div>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:16px;text-indent:-16px;margin:2px 0">$1. $2</div>')
    // Tables — convert | col | col | to simple display
    .replace(/^\|(.+)\|$/gm, (_, row) => {
      const cells = row.split("|").map((c: string) => c.trim()).filter(Boolean);
      if (cells.every((c: string) => /^[-:]+$/.test(c))) return ""; // separator row
      return `<div style="display:flex;gap:12px;font-size:12px;padding:2px 0">${cells.map((c: string) => `<span style="flex:1">${c}</span>`).join("")}</div>`;
    })
    // Paragraphs (double newline)
    .replace(/\n\n/g, '<div style="margin-top:8px"></div>')
    // Single newlines
    .replace(/\n/g, "<br>");
}

export function AskPanel({ dealName }: { dealName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load saved conversations on mount
  useEffect(() => {
    fetch(`/api/deals/${dealName}/conversations`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages?.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [dealName]);

  // Save conversations whenever messages change
  const saveMessages = useCallback(
    (msgs: Message[]) => {
      if (msgs.length === 0) return;
      fetch(`/api/deals/${dealName}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      }).catch(() => {});
    },
    [dealName]
  );

  useEffect(() => {
    if (loaded && messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages, loaded, saveMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    const userMsg: Message = {
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`/api/deals/${dealName}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: res.ok ? data.answer : `Error: ${data.error}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to get response. Try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function clearConversation() {
    setMessages([]);
    fetch(`/api/deals/${dealName}/conversations`, { method: "DELETE" }).catch(
      () => {}
    );
  }

  return (
    <div className="flex flex-col h-[70vh]">
      {/* Header */}
      {messages.length > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={clearConversation}
            className="text-xs text-muted hover:text-vc-red transition-colors"
          >
            Clear conversation
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && loaded && (
          <div className="text-center py-12 text-muted">
            <p className="text-lg mb-2">Ask about this deal</p>
            <p className="text-sm mb-4">
              Claude has the full analysis memo as context.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "What's the biggest risk here?",
                "Is the valuation reasonable?",
                "How does the team compare to competitors?",
                "What would make this a PROCEED?",
                "Summarize the bear case in 3 sentences",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-blue/10 hover:text-blue rounded-full text-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-navy text-white"
                  : "bg-gray-100 text-body"
              }`}
            >
              {msg.role === "user" ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <div
                  className="prose-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              )}
              <div
                className={`text-[10px] mt-1 ${
                  msg.role === "user" ? "text-white/50" : "text-muted/50"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-muted animate-pulse">
              Thinking — this usually takes 15-20 seconds...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this deal..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue/40 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 py-2.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-blue transition-colors disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
