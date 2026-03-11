import {
  createStageUseCase,
  listStagesUseCase,
} from "@/api/useCase/stage.useCase";
import {
  errorResponse,
  ok,
  created,
  badRequest,
} from "@/api/helpers/apiResponse";
import { StagePlacementInput } from "@/types/stage";

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
      .map((raw) => Number(raw.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);

    const hasFilter = stageName !== "" || pieceIds.length > 0;
    const data = await listStagesUseCase(
      hasFilter ? { stageName, pieceIds } : undefined,
    );
    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const stageNo = asNumberOrNull(body.stageNo);
    if (!stageNo || !Number.isInteger(stageNo) || stageNo <= 0) {
      return badRequest("stageNo must be a positive integer");
    }

    const stageName = asString(body.stageName).trim();
    if (!stageName) {
      return badRequest("stageName is required");
    }

    const placementsRaw = Array.isArray(body.placements) ? body.placements : [];
    if (!placementsRaw.every((p) => isValidPlacement(p))) {
      return badRequest(
        "placements must contain valid side(enemy),rowNo(0..2),colNo(0..8),pieceId",
      );
    }

    const placements = placementsRaw as StagePlacementInput[];
    if (hasDuplicateBoardCell(placements)) {
      return badRequest("placements contain duplicate board cells");
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

    return created({ stage });
  } catch (error) {
    return errorResponse(error);
  }
}
