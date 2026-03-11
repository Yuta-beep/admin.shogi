import { PieceRecord } from "@/api/model/piece";
import { getSupabaseAdminClient } from "@/lib/supabase";

// DAOが受け取るDB挿入/更新用の型（フォーム型に非依存）
export type InsertPieceInput = {
  pieceCode: string;
  kanji: string;
  name: string;
  moveDescriptionJa: string | null;
  movePatternId: number;
  skillId: number | null;
  imageSource: string;
  imageBucket: string | null;
  imageKey: string | null;
  imageVersion: number;
  isActive: boolean;
  publishedAt: string | null;
  unpublishedAt: string | null;
};

const PIECE_SELECT =
  "piece_id,piece_code,kanji,name,move_description_ja,move_pattern_id,skill_id,image_source,image_bucket,image_key,image_version,is_active,published_at,unpublished_at,created_at,updated_at,m_move_pattern:move_pattern_id(move_name),m_skill:skill_id(skill_desc)";

function firstRelation<T extends Record<string, unknown>>(
  value: unknown,
): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  if (value && typeof value === "object") return value as T;
  return null;
}

function mapPieceRow(row: Record<string, unknown>): PieceRecord {
  const movePattern = firstRelation<{ move_name?: string | null }>(
    row.m_move_pattern,
  );
  const skill = firstRelation<{ skill_desc?: string | null }>(row.m_skill);

  return {
    pieceId: row.piece_id as number,
    pieceCode: row.piece_code as string,
    kanji: row.kanji as string,
    name: row.name as string,
    moveDescriptionJa: (row.move_description_ja as string | null) ?? null,
    movePatternId: row.move_pattern_id as number,
    movePatternName: movePattern?.move_name ?? null,
    skillId: (row.skill_id as number | null) ?? null,
    skillDesc: skill?.skill_desc ?? null,
    imageSource: (row.image_source as string) ?? "supabase",
    imageBucket: (row.image_bucket as string | null) ?? null,
    imageKey: (row.image_key as string | null) ?? null,
    imageVersion: (row.image_version as number) ?? 1,
    isActive: (row.is_active as boolean) ?? true,
    publishedAt: (row.published_at as string | null) ?? null,
    unpublishedAt: (row.unpublished_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toDbPayload(input: InsertPieceInput) {
  return {
    piece_code: input.pieceCode,
    kanji: input.kanji,
    name: input.name,
    move_description_ja: input.moveDescriptionJa,
    move_pattern_id: input.movePatternId,
    skill_id: input.skillId,
    image_source: input.imageSource,
    image_bucket: input.imageBucket,
    image_key: input.imageKey,
    image_version: input.imageVersion,
    is_active: input.isActive,
    published_at: input.publishedAt,
    unpublished_at: input.unpublishedAt,
  };
}

export async function listPieces(): Promise<PieceRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_piece")
    .select(PIECE_SELECT)
    .order("piece_id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPieceRow(row as Record<string, unknown>));
}

export async function getPieceById(
  pieceId: number,
): Promise<PieceRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_piece")
    .select(PIECE_SELECT)
    .eq("piece_id", pieceId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapPieceRow(data as Record<string, unknown>);
}

export async function insertPiece(
  input: InsertPieceInput,
): Promise<PieceRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_piece")
    .insert(toDbPayload(input))
    .select("piece_id")
    .single();

  if (error) throw new Error(error.message);
  return getPieceById(data.piece_id as number);
}

export async function updatePiece(
  pieceId: number,
  input: InsertPieceInput,
): Promise<PieceRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .schema("master")
    .from("m_piece")
    .update(toDbPayload(input))
    .eq("piece_id", pieceId);

  if (error) throw new Error(error.message);
  return getPieceById(pieceId);
}

export async function deletePiece(pieceId: number): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .schema("master")
    .from("m_piece")
    .delete()
    .eq("piece_id", pieceId);

  if (error) throw new Error(error.message);
}
