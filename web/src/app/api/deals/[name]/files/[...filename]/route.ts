import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEALS_DIR, OUTPUT_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".md": "text/markdown; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

// GET /api/deals/[name]/files/[...filename] — serve a deal file
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string; filename: string[] }> }
) {
  const { name, filename } = await params;
  // Catch-all gives array of segments — join them back
  const decodedFilename = decodeURIComponent(filename.join("/"));

  // Try deal directory first, then output directory
  const dealDir = path.join(DEALS_DIR, name);
  let filePath = path.join(dealDir, decodedFilename);

  // Path traversal protection
  const resolvedDeal = path.resolve(filePath);
  const resolvedDealDir = path.resolve(dealDir);
  const resolvedOutputDir = path.resolve(OUTPUT_DIR);

  if (!resolvedDeal.startsWith(resolvedDealDir)) {
    // Check output directory as fallback
    filePath = path.join(OUTPUT_DIR, decodedFilename);
    const resolvedOutput = path.resolve(filePath);
    if (!resolvedOutput.startsWith(resolvedOutputDir)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
  }

  if (!fs.existsSync(filePath)) {
    // Try output dir for deliverables
    const outputPath = path.join(OUTPUT_DIR, decodedFilename);
    if (fs.existsSync(outputPath)) {
      filePath = outputPath;
    } else {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
    },
  });
}
