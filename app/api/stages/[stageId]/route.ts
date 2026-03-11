import { NextResponse } from "next/server";
import {
  getStageById,
  listStagePlacementsByStageId,
} from "@/features/stage/api/dao/stage.dao";

export const runtime = "nodejs";

type Params = {
  params: {
    stageId: string;
  };
};

function parseStageId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("stageId must be a positive integer");
  }
  return id;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const stageId = parseStageId(params.stageId);
    const stage = await getStageById(stageId);
    if (!stage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }
    const placements = await listStagePlacementsByStageId(stageId);
    return NextResponse.json({ stage, placements });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request";
    const status = message.includes("positive integer") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
