import {
  MovePatternOption,
  PieceFormInput,
  PieceRecord,
  SkillOption,
} from "@/features/piece/domain/piece.types";
import { getSupabaseAdminClient } from "@/shared/lib/supabase-admin-client";

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
  const skill = firstRelation<{ skill_name?: string | null }>(row.m_skill);

  return {
    pieceId: row.piece_id as number,
    pieceCode: row.piece_code as string,
    kanji: row.kanji as string,
    name: row.name as string,
    movePatternId: row.move_pattern_id as number,
    movePatternName: movePattern?.move_name ?? null,
    skillId: (row.skill_id as number | null) ?? null,
    skillName: skill?.skill_name ?? null,
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

export async function listPieces() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_piece")
    .select(
      "piece_id,piece_code,kanji,name,move_pattern_id,skill_id,image_source,image_bucket,image_key,image_version,is_active,published_at,unpublished_at,created_at,updated_at,m_move_pattern:move_pattern_id(move_name),m_skill:skill_id(skill_name)",
    )
    .order("piece_id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPieceRow(row as Record<string, unknown>));
}

export async function listMovePatterns() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_move_pattern")
    .select(
      "move_pattern_id,move_code,move_name,m_move_pattern_vector(dx,dy,max_step)",
    )
    .order("move_pattern_id", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(
    (row): MovePatternOption => ({
      id: row.move_pattern_id as number,
      moveCode: row.move_code as string,
      moveName: row.move_name as string,
      vectors: Array.isArray(row.m_move_pattern_vector)
        ? row.m_move_pattern_vector.map((v) => ({
            dx: v.dx as number,
            dy: v.dy as number,
            maxStep: v.max_step as number,
          }))
        : [],
    }),
  );
}

export async function listSkills() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_skill")
    .select("skill_id,skill_code,skill_name")
    .order("skill_id", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(
    (row): SkillOption => ({
      id: row.skill_id as number,
      skillCode: row.skill_code as string,
      skillName: row.skill_name as string,
    }),
  );
}

export async function getPieceById(pieceId: number) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_piece")
    .select(
      "piece_id,piece_code,kanji,name,move_pattern_id,skill_id,image_source,image_bucket,image_key,image_version,is_active,published_at,unpublished_at,created_at,updated_at,m_move_pattern:move_pattern_id(move_name),m_skill:skill_id(skill_name)",
    )
    .eq("piece_id", pieceId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapPieceRow(data as Record<string, unknown>);
}

function toDbPayload(
  input: PieceFormInput,
  imageOverride?: { imageBucket: string; imageKey: string },
) {
  return {
    piece_code: input.pieceCode,
    kanji: input.kanji,
    name: input.name,
    move_pattern_id: input.movePatternId,
    skill_id: input.skillId,
    image_source: input.imageSource,
    image_bucket: imageOverride?.imageBucket ?? null,
    image_key: imageOverride?.imageKey ?? null,
    image_version: input.imageVersion,
    is_active: input.isActive,
    published_at: input.publishedAt,
    unpublished_at: input.unpublishedAt,
  };
}

export async function insertPiece(
  input: PieceFormInput,
  imageOverride?: { imageBucket: string; imageKey: string },
) {
  const supabase = getSupabaseAdminClient();
  const payload = toDbPayload(input, imageOverride);

  const { data, error } = await supabase
    .schema("master")
    .from("m_piece")
    .insert(payload)
    .select("piece_id")
    .single();

  if (error) throw new Error(error.message);

  return getPieceById(data.piece_id as number);
}

export async function updatePieceRecord(
  pieceId: number,
  input: PieceFormInput,
  imageOverride?: {
    imageBucket: string;
    imageKey: string;
    imageVersion: number;
  },
) {
  const supabase = getSupabaseAdminClient();
  const basePayload = toDbPayload(input, imageOverride);
  const payload = {
    ...basePayload,
    image_version: imageOverride?.imageVersion ?? input.imageVersion,
  };

  const { error } = await supabase
    .schema("master")
    .from("m_piece")
    .update(payload)
    .eq("piece_id", pieceId);

  if (error) throw new Error(error.message);

  return getPieceById(pieceId);
}

export async function deletePieceRecord(pieceId: number) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .schema("master")
    .from("m_piece")
    .delete()
    .eq("piece_id", pieceId);

  if (error) throw new Error(error.message);
}
