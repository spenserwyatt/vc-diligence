import { NextRequest, NextResponse } from "next/server";
import { getDealDetail } from "@/lib/deals";

export const dynamic = "force-dynamic";

// GET /api/deals/[name] — deal detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const deal = getDealDetail(name);

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json(deal);
}
