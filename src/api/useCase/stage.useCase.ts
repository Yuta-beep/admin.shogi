import {
  PieceOption,
  StagePlacementRecord,
  StageRecord,
} from "@/api/model/stage";
import {
  existsStageNo,
  insertStage,
  listPieceOptions,
  listStagePieceUsages,
  listStagePlacementsByStageId,
  listStages,
  getStageById,
} from "@/api/dao/stage.dao";
import { StageFormInput } from "@/types/stage";

// レスポンス型
export type StageListResponse = {
  stages: StageRecord[];
  pieces: PieceOption[];
};

export type StageDetailResponse = {
  stage: StageRecord;
  placements: StagePlacementRecord[];
};

type StageSearchInput = {
  stageName?: string;
  pieceIds?: number[];
};

// ステージ一覧取得（検索対応）
export async function listStagesUseCase(
  search?: StageSearchInput,
): Promise<StageListResponse> {
  const keyword = (search?.stageName ?? "").trim().toLowerCase();
  const normalizedPieceIds = Array.from(
    new Set(
      (search?.pieceIds ?? []).filter((id) => Number.isInteger(id) && id > 0),
    ),
  );
  const hasFilter = keyword !== "" || normalizedPieceIds.length > 0;

  if (!hasFilter) {
    const [stages, pieces] = await Promise.all([
      listStages(),
      listPieceOptions(),
    ]);
    return { stages, pieces };
  }

  const [stages, pieces, stagePieceUsages] = await Promise.all([
    listStages(),
    listPieceOptions(),
    listStagePieceUsages(),
  ]);

  const matchedStageIds =
    normalizedPieceIds.length > 0
      ? new Set(
          stagePieceUsages
            .filter((usage) => normalizedPieceIds.includes(usage.pieceId))
            .map((usage) => usage.stageId),
        )
      : null;

  const filteredStages = stages.filter((stage) => {
    if (keyword && !stage.stageName.toLowerCase().includes(keyword)) {
      return false;
    }
    if (matchedStageIds && !matchedStageIds.has(stage.stageId)) {
      return false;
    }
    return true;
  });

  return { stages: filteredStages, pieces };
}

// ステージ詳細取得
export async function getStageDetailUseCase(
  stageId: number,
): Promise<StageDetailResponse | null> {
  const stage = await getStageById(stageId);
  if (!stage) return null;

  const placements = await listStagePlacementsByStageId(stageId);
  return { stage, placements };
}

// ステージ作成
export async function createStageUseCase(
  input: StageFormInput,
): Promise<StageRecord> {
  const alreadyExists = await existsStageNo(input.stageNo);
  if (alreadyExists) {
    throw new Error(`stageNo ${input.stageNo} already exists`);
  }

  return insertStage({
    stageNo: input.stageNo,
    stageName: input.stageName,
    unlockStageNo: input.unlockStageNo,
    difficulty: input.difficulty,
    stageCategory: input.stageCategory,
    clearConditionType: input.clearConditionType,
    clearConditionParams: input.clearConditionParams,
    recommendedPower: input.recommendedPower,
    staminaCost: input.staminaCost,
    isActive: input.isActive,
    publishedAt: input.publishedAt,
    unpublishedAt: input.unpublishedAt,
    placements: input.placements,
  });
}
