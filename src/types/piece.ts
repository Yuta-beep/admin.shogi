import { MovePatternVector, SkillDraftInput } from "@/api/model/piece";

export type PieceFormInput = {
  pieceCode: string;
  kanji: string;
  name: string;
  rarity: "N" | "R" | "SR" | "UR" | "SSR";
  moveDescriptionJa: string | null;
  movePatternId: number | null;
  moveVectors: MovePatternVector[];
  moveCanJump: boolean | null;
  moveConstraintsJson: Record<string, unknown> | null;
  moveRulesJson: Array<{
    ruleType: string;
    priority?: number;
    paramsJson?: Record<string, unknown> | null;
  }> | null;
  skillId: number | null;
  skillDraft: SkillDraftInput | null;
  imageSource: "supabase" | "s3";
  imageVersion: number;
  isActive: boolean;
  publishedAt: string | null;
  unpublishedAt: string | null;
  imageFile: File | null;
};
