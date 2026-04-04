import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEALS_DIR } from "@/lib/paths";
import { listDeals, writeMeta } from "@/lib/deals";

export const dynamic = "force-dynamic";

// GET /api/deals — list all deals
export async function GET() {
  const deals = listDeals();
  return NextResponse.json(deals);
}

// POST /api/deals — create a new deal with uploaded files
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = formData.get("name") as string;

  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    return NextResponse.json(
      { error: "Invalid deal name. Use lowercase letters, numbers, and hyphens." },
      { status: 400 }
    );
  }

  const dealDir = path.join(DEALS_DIR, name);

  if (fs.existsSync(dealDir)) {
    return NextResponse.json(
      { error: "A deal with this name already exists." },
      { status: 409 }
    );
  }

  // Create directory
  fs.mkdirSync(dealDir, { recursive: true });

  // Save uploaded files
  const files = formData.getAll("files") as File[];
  for (const file of files) {
    if (!file.name) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = path.basename(file.name);
    const filePath = path.join(dealDir, safeName);
    fs.writeFileSync(filePath, buffer);
  }

  // Save deal metadata
  const source = (formData.get("source") as string) || "";
  writeMeta(name, {
    source,
    dateReceived: new Date().toISOString().split("T")[0],
  });

  return NextResponse.json({ name, path: dealDir }, { status: 201 });
}
