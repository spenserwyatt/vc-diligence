import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEALS_DIR } from "@/lib/paths";

export const dynamic = "force-dynamic";

const CONV_FILE = "conversations.json";

// GET /api/deals/[name]/conversations — load saved conversations
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const convPath = path.join(DEALS_DIR, name, CONV_FILE);

  if (!fs.existsSync(convPath)) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const data = JSON.parse(fs.readFileSync(convPath, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

// POST /api/deals/[name]/conversations — save conversations
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
  const convPath = path.join(dealDir, CONV_FILE);
  fs.writeFileSync(convPath, JSON.stringify(body, null, 2));

  return NextResponse.json({ saved: true });
}

// DELETE /api/deals/[name]/conversations — clear conversations
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const convPath = path.join(DEALS_DIR, name, CONV_FILE);

  if (fs.existsSync(convPath)) {
    fs.unlinkSync(convPath);
  }

  return NextResponse.json({ cleared: true });
}
