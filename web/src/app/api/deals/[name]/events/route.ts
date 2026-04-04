import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEALS_DIR } from "@/lib/paths";
import { readStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

// GET /api/deals/[name]/events — lightweight status poll (replaces SSE)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const dealDir = path.join(DEALS_DIR, name);

  if (!fs.existsSync(dealDir)) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const status = readStatus(name);
  // Match both deal phases (01-extraction.md) and fund phases (P1-people.md, fund-memo.md)
  const files = fs.readdirSync(dealDir).filter(
    (f) => /^\d{2}-/.test(f) || /^P\d-/.test(f) || f === "fund-memo.md" || f === "deck-extracted.md"
  );

  return NextResponse.json({ ...status, completedFiles: files });
}
