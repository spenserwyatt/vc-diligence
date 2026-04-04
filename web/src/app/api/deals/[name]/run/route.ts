import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEALS_DIR } from "@/lib/paths";
import { readStatus } from "@/lib/status";
import { runPipeline, type PipelineType } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

// POST /api/deals/[name]/run — trigger pipeline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const dealDir = path.join(DEALS_DIR, name);

  if (!fs.existsSync(dealDir)) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const currentStatus = readStatus(name);
  if (currentStatus.state === "running") {
    return NextResponse.json(
      { error: "Pipeline is already running" },
      { status: 409 }
    );
  }

  const body = await request.json();
  const pipelineType = (body.type || "screening") as PipelineType;
  const context = typeof body.context === "string" ? body.context.trim() : "";

  if (!["screening", "fund", "deep"].includes(pipelineType)) {
    return NextResponse.json(
      { error: "Invalid pipeline type" },
      { status: 400 }
    );
  }

  // Spawn detached process — does not block the server
  runPipeline(name, pipelineType, context);

  return NextResponse.json({ status: "started", type: pipelineType });
}
