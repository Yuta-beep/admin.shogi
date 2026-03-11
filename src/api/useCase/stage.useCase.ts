import {
  RewardOption,
  PieceOption,
  StagePlacementRecord,
  StageRewardRecord,
  StageRecord,
} from "@/api/model/stage";
import {
  existsStageNo,
  insertStage,
  listRewardOptions,
  listPieceOptions,
  listStageRewardsByStageId,
  listStagePieceUsages,
  listStagePlacementsByStageId,
  replaceStageRewards,
  listStages,
  getStageById,
} from "@/api/dao/stage.dao";
import { StageFormInput, StageRewardInput } from "@/types/stage";

// レスポンス型
export type StageListResponse = {
  stages: StageRecord[];
  pieces: PieceOption[];
  rewardOptions: RewardOption[];
};

export type StageDetailResponse = {
  stage: StageRecord;
  placements: StagePlacementRecord[];
  rewards: StageRewardRecord[];
  rewardOptions: RewardOption[];
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
    const [stages, pieces, rewardOptions] = await Promise.all([
      listStages(),
      listPieceOptions(),
      listRewardOptions(),
    ]);
    return { stages, pieces, rewardOptions };
  }

  const [stages, pieces, rewardOptions, stagePieceUsages] = await Promise.all([
    listStages(),
    listPieceOptions(),
    listRewardOptions(),
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

  return { stages: filteredStages, pieces, rewardOptions };
}

// ステージ詳細取得
export async function getStageDetailUseCase(
  stageId: number,
): Promise<StageDetailResponse | null> {
  const stage = await getStageById(stageId);
  if (!stage) return null;

  const [placements, rewards, rewardOptions] = await Promise.all([
    listStagePlacementsByStageId(stageId),
    listStageRewardsByStageId(stageId),
    listRewardOptions(),
  ]);
  return { stage, placements, rewards, rewardOptions };
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
    rewards: input.rewards,
  });
}

export async function updateStageRewardsUseCase(
  stageId: number,
  rewards: StageRewardInput[],
): Promise<StageRewardRecord[] | null> {
  const stage = await getStageById(stageId);
  if (!stage) return null;

  await replaceStageRewards(stageId, rewards);
  return listStageRewardsByStageId(stageId);
}
