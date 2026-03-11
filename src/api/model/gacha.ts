export type GachaRecord = {
  gachaId: number;
  gachaCode: string;
  gachaName: string;
  description: string | null;
  rarityRateN: number;
  rarityRateR: number;
  rarityRateSr: number;
  rarityRateUr: number;
  rarityRateSsr: number;
  pawnCost: number;
  goldCost: number;
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

export type GachaPieceOption = {
  pieceId: number;
  pieceCode: string;
  char: string;
  name: string;
  rarity: "N" | "R" | "SR" | "UR" | "SSR";
};

export type GachaTargetPieceRecord = {
  pieceId: number;
  pieceCode: string;
  char: string;
  name: string;
  rarity: "N" | "R" | "SR" | "UR" | "SSR";
  weight: number;
  isActive: boolean;
};
