export type StageRecord = {
  stageId: number;
  stageNo: number;
  stageName: string;
  unlockStageNo: number | null;
  difficulty: number | null;
  stageCategory: string;
  clearConditionType: string;
  clearConditionParams: Record<string, unknown> | null;
  recommendedPower: number | null;
  staminaCost: number;
  isActive: boolean;
  publishedAt: string | null;
  unpublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RewardOption = {
  rewardId: number;
  rewardCode: string;
  rewardType: string;
  rewardName: string;
  itemCode: string | null;
  pieceId: number | null;
  pieceChar: string | null;
  pieceName: string | null;
  isActive: boolean;
};

export type StageRewardRecord = {
  stageRewardId: number;
  rewardId: number;
  rewardTiming: string;
  quantity: number;
  dropRate: number | null;
  sortOrder: number;
  isActive: boolean;
  rewardCode: string | null;
  rewardType: string | null;
  rewardName: string | null;
  itemCode: string | null;
  pieceId: number | null;
  pieceChar: string | null;
  pieceName: string | null;
};

export type StagePlacementRecord = {
  side: "player" | "enemy";
  rowNo: number;
  colNo: number;
  pieceId: number;
  pieceCode: string | null;
  pieceChar: string | null;
  pieceName: string | null;
};

export type PieceOption = {
  pieceId: number;
  pieceCode: string;
  char: string;
  name: string;
};
