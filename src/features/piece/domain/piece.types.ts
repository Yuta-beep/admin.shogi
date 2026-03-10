export type PieceRecord = {
  pieceId: number;
  pieceCode: string;
  kanji: string;
  name: string;
  movePatternId: number;
  movePatternName: string | null;
  skillId: number | null;
  skillName: string | null;
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
  skillName: string;
};

export type PieceFormInput = {
  pieceCode: string;
  kanji: string;
  name: string;
  movePatternId: number;
  skillId: number | null;
  imageSource: "supabase" | "s3";
  imageVersion: number;
  isActive: boolean;
  publishedAt: string | null;
  unpublishedAt: string | null;
  imageFile: File | null;
};
