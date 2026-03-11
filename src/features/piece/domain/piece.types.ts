export type PieceRecord = {
  pieceId: number;
  pieceCode: string;
  kanji: string;
  name: string;
  movePatternId: number;
  movePatternName: string | null;
  skillId: number | null;
  skillDesc: string | null;
  imageSource: string;
  imageBucket: string | null;
  imageKey: string | null;
  imageVersion: number;
  isActive: boolean;
  publishedAt: string | null;
  unpublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MovePatternOption = {
  id: number;
  moveCode: string;
  moveName: string;
  vectors: MovePatternVector[];
};

export type MovePatternVector = {
  dx: number;
  dy: number;
  maxStep: number;
};

export type SkillOption = {
  id: number;
  skillCode: string;
  skillDesc: string;
  effectSummary: string | null;
  effectCount: number;
};

export type SkillDraftOptions = {
  effectTypes: string[];
  targetRules: string[];
  triggerTimings: string[];
};

export type SkillEffectRecord = {
  skillEffectId: number;
  effectOrder: number;
  effectType: string;
  targetRule: string;
  triggerTiming: string;
  procChance: number | null;
  durationTurns: number | null;
  radius: number | null;
  valueNum: number | null;
  valueText: string | null;
  paramsJson: Record<string, unknown> | null;
};

export type PieceFormInput = {
  pieceCode: string;
  kanji: string;
  name: string;
  movePatternId: number | null;
  moveVectors: MovePatternVector[];
  skillId: number | null;
  skillDraft: SkillDraftInput | null;
  imageSource: "supabase" | "s3";
  imageVersion: number;
  isActive: boolean;
  publishedAt: string | null;
  unpublishedAt: string | null;
  imageFile: File | null;
};

export type SkillDraftInput = {
  skillDesc: string;
  effectType: string;
  targetRule: string;
  triggerTiming: string;
  valueText: string | null;
  valueNum: number | null;
  procChance: number | null;
  durationTurns: number | null;
  radius: number | null;
  paramsJson: Record<string, unknown> | null;
};
