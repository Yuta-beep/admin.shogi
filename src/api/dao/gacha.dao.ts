import {
  GachaPieceOption,
  GachaRecord,
  GachaTargetPieceRecord,
} from "@/api/model/gacha";
import { getSupabaseAdminClient } from "@/lib/supabase";

export type InsertGachaInput = {
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
};

export type GachaTargetPieceInput = {
  pieceId: number;
  weight: number;
  isActive: boolean;
};

type GachaPieceCountRecord = {
  gachaId: number;
  pieceCount: number;
};

const GACHA_SELECT =
  "gacha_id,gacha_code,gacha_name,description,rarity_rate_n,rarity_rate_r,rarity_rate_sr,rarity_rate_ur,rarity_rate_ssr,pawn_cost,gold_cost,image_source,image_bucket,image_key,image_version,is_active,published_at,unpublished_at,created_at,updated_at";

function mapRarity(
  value: string | null | undefined,
): "N" | "R" | "SR" | "UR" | "SSR" {
  if (value === "R" || value === "SR" || value === "UR" || value === "SSR") {
    return value;
  }
  return "N";
}

function firstRelation<T extends Record<string, unknown>>(
  value: unknown,
): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  if (value && typeof value === "object") return value as T;
  return null;
}

function mapGachaRow(row: Record<string, unknown>): GachaRecord {
  return {
    gachaId: row.gacha_id as number,
    gachaCode: row.gacha_code as string,
    gachaName: row.gacha_name as string,
    description: (row.description as string | null) ?? null,
    rarityRateN: Number(row.rarity_rate_n ?? 0),
    rarityRateR: Number(row.rarity_rate_r ?? 0),
    rarityRateSr: Number(row.rarity_rate_sr ?? 0),
    rarityRateUr: Number(row.rarity_rate_ur ?? 0),
    rarityRateSsr: Number(row.rarity_rate_ssr ?? 0),
    pawnCost: Number(row.pawn_cost ?? 0),
    goldCost: Number(row.gold_cost ?? 0),
    imageSource: ((row.image_source as string | null) ?? "supabase") as string,
    imageBucket: (row.image_bucket as string | null) ?? null,
    imageKey: (row.image_key as string | null) ?? null,
    imageVersion: Number(row.image_version ?? 1),
    isActive: (row.is_active as boolean) ?? true,
    publishedAt: (row.published_at as string | null) ?? null,
    unpublishedAt: (row.unpublished_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toDbPayload(input: InsertGachaInput) {
  return {
    gacha_code: input.gachaCode,
    gacha_name: input.gachaName,
    description: input.description,
    rarity_rate_n: input.rarityRateN,
    rarity_rate_r: input.rarityRateR,
    rarity_rate_sr: input.rarityRateSr,
    rarity_rate_ur: input.rarityRateUr,
    rarity_rate_ssr: input.rarityRateSsr,
    pawn_cost: input.pawnCost,
    gold_cost: input.goldCost,
    image_source: input.imageSource,
    image_bucket: input.imageBucket,
    image_key: input.imageKey,
    image_version: input.imageVersion,
    is_active: input.isActive,
    published_at: input.publishedAt,
    unpublished_at: input.unpublishedAt,
  };
}

export async function listGachas(): Promise<GachaRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_gacha")
    .select(GACHA_SELECT)
    .order("gacha_id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapGachaRow(row as Record<string, unknown>));
}

export async function getGachaById(
  gachaId: number,
): Promise<GachaRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_gacha")
    .select(GACHA_SELECT)
    .eq("gacha_id", gachaId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapGachaRow(data as Record<string, unknown>);
}

export async function existsGachaCode(
  gachaCode: string,
  excludeGachaId?: number,
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .schema("master")
    .from("m_gacha")
    .select("gacha_id", { count: "exact", head: true })
    .eq("gacha_code", gachaCode);

  if (excludeGachaId) {
    query = query.neq("gacha_id", excludeGachaId);
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function insertGacha(
  input: InsertGachaInput,
): Promise<GachaRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_gacha")
    .insert(toDbPayload(input))
    .select("gacha_id")
    .single();

  if (error) throw new Error(error.message);
  return getGachaById(data.gacha_id as number);
}

export async function updateGacha(
  gachaId: number,
  input: InsertGachaInput,
): Promise<GachaRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .schema("master")
    .from("m_gacha")
    .update(toDbPayload(input))
    .eq("gacha_id", gachaId);

  if (error) throw new Error(error.message);
  return getGachaById(gachaId);
}

export async function listGachaPieceOptions(): Promise<GachaPieceOption[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_piece")
    .select("piece_id,piece_code,kanji,name,rarity")
    .order("piece_id", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(
    (row): GachaPieceOption => ({
      pieceId: row.piece_id as number,
      pieceCode: row.piece_code as string,
      char: row.kanji as string,
      name: row.name as string,
      rarity: mapRarity(row.rarity as string | null),
    }),
  );
}

export async function replaceGachaPieces(
  gachaId: number,
  pieces: GachaTargetPieceInput[],
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: deleteError } = await supabase
    .schema("master")
    .from("m_gacha_piece")
    .delete()
    .eq("gacha_id", gachaId);
  if (deleteError) throw new Error(deleteError.message);

  if (pieces.length === 0) return;

  const { error: insertError } = await supabase
    .schema("master")
    .from("m_gacha_piece")
    .insert(
      pieces.map((piece) => ({
        gacha_id: gachaId,
        piece_id: piece.pieceId,
        weight: piece.weight,
        is_active: piece.isActive,
      })),
    );
  if (insertError) throw new Error(insertError.message);
}

export async function listGachaTargetPiecesByGachaId(
  gachaId: number,
): Promise<GachaTargetPieceRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_gacha_piece")
    .select(
      "piece_id,weight,is_active,m_piece:piece_id(piece_code,kanji,name,rarity)",
    )
    .eq("gacha_id", gachaId)
    .order("piece_id", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const piece = firstRelation<{
      piece_code?: string | null;
      kanji?: string | null;
      name?: string | null;
      rarity?: string | null;
    }>(row.m_piece);

    return {
      pieceId: row.piece_id as number,
      pieceCode: piece?.piece_code ?? "",
      char: piece?.kanji ?? "",
      name: piece?.name ?? "",
      rarity: mapRarity(piece?.rarity),
      weight: Number(row.weight ?? 1),
      isActive: (row.is_active as boolean) ?? true,
    };
  });
}

export async function listGachaPieceCounts(): Promise<GachaPieceCountRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_gacha_piece")
    .select("gacha_id");

  if (error) throw new Error(error.message);

  const counter = new Map<number, number>();
  for (const row of data ?? []) {
    const gachaId = row.gacha_id as number;
    counter.set(gachaId, (counter.get(gachaId) ?? 0) + 1);
  }

  return Array.from(counter.entries()).map(([gachaId, pieceCount]) => ({
    gachaId,
    pieceCount,
  }));
}
