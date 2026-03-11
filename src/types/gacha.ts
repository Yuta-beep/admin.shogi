export type GachaTargetPieceInput = {
  pieceId: number;
  weight: number;
  isActive: boolean;
};

export type GachaFormInput = {
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
  targetPieces: GachaTargetPieceInput[];
};
