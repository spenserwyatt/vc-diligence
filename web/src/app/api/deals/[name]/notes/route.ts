import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEALS_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";

function notesPath(dealName: string) {
  return path.join(DEALS_DIR, dealName, "notes.md");
}

// GET /api/deals/[name]/notes — return notes.md content
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const dealDir = path.join(DEALS_DIR, name);
  if (!fs.existsSync(dealDir)) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const fp = notesPath(name);
  const content = fs.existsSync(fp) ? fs.readFileSync(fp, "utf-8") : "";
  return NextResponse.json({ content });
}

// POST /api/deals/[name]/notes — append a timestamped entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const dealDir = path.join(DEALS_DIR, name);
  if (!fs.existsSync(dealDir)) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const body = await request.json();
  const text = body.text?.trim();
  const label = body.label?.trim() || "";
  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const heading = label ? `## ${dateStr} — ${label}` : `## ${dateStr}`;

  const entry = `${heading}\n\n${text}\n`;
  const fp = notesPath(name);
  const existing = fs.existsSync(fp) ? fs.readFileSync(fp, "utf-8") : "";

  // Prepend new entry (newest first), separated by horizontal rule
  const updated = existing
    ? `${entry}\n---\n\n${existing}`
    : entry;

  fs.writeFileSync(fp, updated);
  return NextResponse.json({ ok: true });
}
