import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEALS_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";

// POST /api/deals/[name]/upload — upload files to deal folder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const dealDir = path.join(DEALS_DIR, name);

  if (!fs.existsSync(dealDir)) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const saved: string[] = [];

  for (const file of files) {
    if (!file.name) continue;

    // Sanitize filename — no path traversal
    const safeName = path.basename(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(dealDir, safeName);

    fs.writeFileSync(filePath, buffer);
    saved.push(safeName);
  }

  return NextResponse.json({ uploaded: saved });
}
