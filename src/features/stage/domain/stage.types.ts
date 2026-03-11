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

export type StagePlacementInput = {
  side: "player" | "enemy";
  rowNo: number;
  colNo: number;
  pieceId: number;
};

export type StageFormInput = {
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
  placements: StagePlacementInput[];
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
