import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEALS_DIR, OUTPUT_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";

// POST /api/deals/[name]/delete — remove a deal and its output files
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  // Validate the name to prevent path traversal
  if (!name || name.includes("..") || name.includes("/")) {
    return NextResponse.json({ error: "Invalid deal name" }, { status: 400 });
  }

  const dealDir = path.join(DEALS_DIR, name);
  if (!fs.existsSync(dealDir)) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  // Don't allow deleting the EXAMPLE deal
  if (name === "EXAMPLE") {
    return NextResponse.json({ error: "Cannot delete EXAMPLE" }, { status: 400 });
  }

  // Remove deal directory
  fs.rmSync(dealDir, { recursive: true, force: true });

  // Remove output files (brief, docx)
  for (const ext of ["-brief.html", "-diligence-memo.docx", "-diligence-report.docx"]) {
    const outputFile = path.join(OUTPUT_DIR, `${name}${ext}`);
    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
  }

  return NextResponse.json({ ok: true });
}
