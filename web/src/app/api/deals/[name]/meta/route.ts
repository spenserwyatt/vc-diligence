import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEALS_DIR } from "@/lib/paths";
import { readMeta, writeMeta } from "@/lib/deals";

export const dynamic = "force-dynamic";

// GET /api/deals/[name]/meta
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!fs.existsSync(path.join(DEALS_DIR, name))) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }
  return NextResponse.json(readMeta(name));
}

// PUT /api/deals/[name]/meta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!fs.existsSync(path.join(DEALS_DIR, name))) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }
  const body = await request.json();
  writeMeta(name, body);
  return NextResponse.json(readMeta(name));
}
