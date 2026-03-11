import { NextResponse } from "next/server";
import { createStageUseCase } from "@/features/stage/usecases/create-stage.usecase";
import { listStagesUseCase } from "@/features/stage/usecases/list-stages.usecase";
import { stageSearchUseCase } from "@/features/stage/usecases/stage-search.usecase";
import { StagePlacementInput } from "@/features/stage/domain/stage.types";

export const runtime = "nodejs";

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function asBool(value: unknown) {
  return value === true;
}

function asIsoOrNull(value: unknown) {
  const raw = asString(value).trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid datetime value");
  return date.toISOString();
}

function isValidPlacement(value: unknown): value is StagePlacementInput {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  const side = obj.side;
  const rowNo = Number(obj.rowNo);
  const colNo = Number(obj.colNo);
  const pieceId = Number(obj.pieceId);

  return (
    side === "enemy" &&
    Number.isInteger(rowNo) &&
    rowNo >= 0 &&
    rowNo <= 2 &&
    Number.isInteger(colNo) &&
    colNo >= 0 &&
    colNo <= 8 &&
    Number.isInteger(pieceId) &&
    pieceId > 0
  );
}

function hasDuplicateBoardCell(placements: StagePlacementInput[]) {
  const cells = new Set<string>();
  for (const placement of placements) {
    const key = `${placement.rowNo}:${placement.colNo}`;
    if (cells.has(key)) return true;
    cells.add(key);
  }
  return false;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stageName = (searchParams.get("stageName") ?? "").trim();
    const pieceIds = searchParams
      .getAll("pieceId")
      .map((pieceIdRaw) => Number(pieceIdRaw.trim()))
      .filter((pieceId) => Number.isInteger(pieceId) && pieceId > 0);
    const hasSearch = stageName !== "" || pieceIds.length > 0;
    const data = hasSearch
      ? await stageSearchUseCase({
          stageName,
          pieceIds,
        })
      : await listStagesUseCase();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const stageNo = asNumberOrNull(body.stageNo);
    if (!stageNo || !Number.isInteger(stageNo) || stageNo <= 0) {
      return NextResponse.json(
        { error: "stageNo must be a positive integer" },
        { status: 400 },
      );
    }

    const stageName = asString(body.stageName).trim();
    if (!stageName) {
      return NextResponse.json(
        { error: "stageName is required" },
        { status: 400 },
      );
    }

    const placementsRaw = Array.isArray(body.placements) ? body.placements : [];
    if (!placementsRaw.every((p) => isValidPlacement(p))) {
      return NextResponse.json(
        {
          error:
            "placements must contain valid side(enemy),rowNo(0..2),colNo(0..8),pieceId",
        },
        { status: 400 },
      );
    }

    const placements = placementsRaw as StagePlacementInput[];
    if (hasDuplicateBoardCell(placements)) {
      return NextResponse.json(
        { error: "placements contain duplicate board cells" },
        { status: 400 },
      );
    }

    const stage = await createStageUseCase({
      stageNo,
      stageName,
      unlockStageNo: asNumberOrNull(body.unlockStageNo),
      difficulty: null,
      stageCategory: asString(body.stageCategory).trim() || "normal",
      clearConditionType:
        asString(body.clearConditionType).trim() || "defeat_boss",
      clearConditionParams: {},
      recommendedPower: null,
      staminaCost: asNumberOrNull(body.staminaCost) ?? 0,
      isActive: asBool(body.isActive),
      publishedAt: asIsoOrNull(body.publishedAt),
      unpublishedAt: asIsoOrNull(body.unpublishedAt),
      placements,
    });

    return NextResponse.json({ stage }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
