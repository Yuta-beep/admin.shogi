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
