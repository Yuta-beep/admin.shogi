import {
  GachaPieceOption,
  GachaRecord,
  GachaTargetPieceRecord,
} from "@/api/model/gacha";
import {
  existsGachaCode,
  getGachaById,
  insertGacha,
  listGachaPieceCounts,
  listGachaPieceOptions,
  listGachas,
  listGachaTargetPiecesByGachaId,
  replaceGachaPieces,
  updateGacha,
} from "@/api/dao/gacha.dao";
import { GachaFormInput } from "@/types/gacha";

export type GachaListItem = GachaRecord & {
  pieceCount: number;
};

export type GachaListResponse = {
  gachas: GachaListItem[];
  pieceOptions: GachaPieceOption[];
};

export type GachaDetailResponse = {
  gacha: GachaRecord;
  targetPieces: GachaTargetPieceRecord[];
};

export async function listGachasUseCase(
  query?: string,
): Promise<GachaListResponse> {
  const [gachas, pieceCounts, pieceOptions] = await Promise.all([
    listGachas(),
    listGachaPieceCounts(),
    listGachaPieceOptions(),
  ]);

  const pieceCountByGachaId = new Map<number, number>(
    pieceCounts.map((item) => [item.gachaId, item.pieceCount]),
  );

  const withCount: GachaListItem[] = gachas.map((gacha) => ({
    ...gacha,
    pieceCount: pieceCountByGachaId.get(gacha.gachaId) ?? 0,
  }));

  const keyword = (query ?? "").trim().toLowerCase();
  const filtered = keyword
    ? withCount.filter((gacha) => {
        return (
          gacha.gachaCode.toLowerCase().includes(keyword) ||
          gacha.gachaName.toLowerCase().includes(keyword)
        );
      })
    : withCount;

  return { gachas: filtered, pieceOptions };
}

export async function getGachaDetailUseCase(
  gachaId: number,
): Promise<GachaDetailResponse | null> {
  const gacha = await getGachaById(gachaId);
  if (!gacha) return null;

  const targetPieces = await listGachaTargetPiecesByGachaId(gachaId);
  return { gacha, targetPieces };
}

export async function createGachaUseCase(
  input: GachaFormInput,
): Promise<GachaRecord> {
  const exists = await existsGachaCode(input.gachaCode);
  if (exists) {
    throw new Error(`gachaCode ${input.gachaCode} already exists`);
  }

  const created = await insertGacha({
    gachaCode: input.gachaCode,
    gachaName: input.gachaName,
    description: input.description,
    rarityRateN: input.rarityRateN,
    rarityRateR: input.rarityRateR,
    rarityRateSr: input.rarityRateSr,
    rarityRateUr: input.rarityRateUr,
    rarityRateSsr: input.rarityRateSsr,
    pawnCost: input.pawnCost,
    goldCost: input.goldCost,
    imageSource: input.imageSource,
    imageBucket: input.imageBucket,
    imageKey: input.imageKey,
    imageVersion: input.imageVersion,
    isActive: input.isActive,
    publishedAt: input.publishedAt,
    unpublishedAt: input.unpublishedAt,
  });
  if (!created) throw new Error("Failed to create gacha");

  await replaceGachaPieces(created.gachaId, input.targetPieces);
  return created;
}

export async function updateGachaUseCase(
  gachaId: number,
  input: GachaFormInput,
): Promise<GachaRecord> {
  const existing = await getGachaById(gachaId);
  if (!existing) throw new Error(`Gacha ${gachaId} not found`);

  const exists = await existsGachaCode(input.gachaCode, gachaId);
  if (exists) {
    throw new Error(`gachaCode ${input.gachaCode} already exists`);
  }

  const updated = await updateGacha(gachaId, {
    gachaCode: input.gachaCode,
    gachaName: input.gachaName,
    description: input.description,
    rarityRateN: input.rarityRateN,
    rarityRateR: input.rarityRateR,
    rarityRateSr: input.rarityRateSr,
    rarityRateUr: input.rarityRateUr,
    rarityRateSsr: input.rarityRateSsr,
    pawnCost: input.pawnCost,
    goldCost: input.goldCost,
    imageSource: input.imageSource,
    imageBucket: input.imageBucket,
    imageKey: input.imageKey,
    imageVersion: input.imageVersion,
    isActive: input.isActive,
    publishedAt: input.publishedAt,
    unpublishedAt: input.unpublishedAt,
  });
  if (!updated) throw new Error("Failed to update gacha");

  await replaceGachaPieces(gachaId, input.targetPieces);
  return updated;
}
