import {
  PieceOption,
  StagePlacementRecord,
  StageRecord,
} from "@/api/model/stage";
import { getSupabaseAdminClient } from "@/lib/supabase";

// DAOが受け取るDB挿入/更新用の型
export type InsertStageInput = {
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
  placements: Array<{
    side: "player" | "enemy";
    rowNo: number;
    colNo: number;
    pieceId: number;
  }>;
};

export type StagePieceUsageRecord = {
  stageId: number;
  pieceId: number;
};

const STAGE_SELECT =
  "stage_id,stage_no,stage_name,unlock_stage_no,difficulty,stage_category,clear_condition_type,clear_condition_params,recommended_power,stamina_cost,is_active,published_at,unpublished_at,created_at,updated_at";

function firstRelation<T extends Record<string, unknown>>(
  value: unknown,
): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  if (value && typeof value === "object") return value as T;
  return null;
}

function mapStageRow(row: Record<string, unknown>): StageRecord {
  return {
    stageId: row.stage_id as number,
    stageNo: row.stage_no as number,
    stageName: row.stage_name as string,
    unlockStageNo: (row.unlock_stage_no as number | null) ?? null,
    difficulty: (row.difficulty as number | null) ?? null,
    stageCategory: (row.stage_category as string | null) ?? "normal",
    clearConditionType:
      (row.clear_condition_type as string | null) ?? "defeat_boss",
    clearConditionParams:
      (row.clear_condition_params as Record<string, unknown> | null) ?? null,
    recommendedPower: (row.recommended_power as number | null) ?? null,
    staminaCost: (row.stamina_cost as number | null) ?? 0,
    isActive: (row.is_active as boolean) ?? true,
    publishedAt: (row.published_at as string | null) ?? null,
    unpublishedAt: (row.unpublished_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listStages(): Promise<StageRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_stage")
    .select(STAGE_SELECT)
    .order("stage_no", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) =>
    mapStageRow(row as unknown as Record<string, unknown>),
  );
}

export async function getStageById(
  stageId: number,
): Promise<StageRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_stage")
    .select(STAGE_SELECT)
    .eq("stage_id", stageId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapStageRow(data as unknown as Record<string, unknown>);
}

export async function existsStageNo(stageNo: number): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .schema("master")
    .from("m_stage")
    .select("stage_id", { count: "exact", head: true })
    .eq("stage_no", stageNo);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function insertStage(
  input: InsertStageInput,
): Promise<StageRecord> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .schema("master")
    .from("m_stage")
    .insert({
      stage_no: input.stageNo,
      stage_name: input.stageName,
      unlock_stage_no: input.unlockStageNo,
      difficulty: input.difficulty,
      stage_category: input.stageCategory,
      clear_condition_type: input.clearConditionType,
      clear_condition_params: input.clearConditionParams,
      recommended_power: input.recommendedPower,
      stamina_cost: input.staminaCost,
      is_active: input.isActive,
      published_at: input.publishedAt,
      unpublished_at: input.unpublishedAt,
    })
    .select(STAGE_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const stageRow = data as unknown as Record<string, unknown>;
  const stageId = stageRow.stage_id as number;

  if (input.placements.length > 0) {
    const { error: placementError } = await supabase
      .schema("master")
      .from("m_stage_initial_placement")
      .insert(
        input.placements.map((placement) => ({
          stage_id: stageId,
          side: placement.side,
          row_no: placement.rowNo,
          col_no: placement.colNo,
          piece_id: placement.pieceId,
        })),
      );

    if (placementError) {
      await supabase
        .schema("master")
        .from("m_stage")
        .delete()
        .eq("stage_id", stageId);

      throw new Error(placementError.message);
    }
  }

  return mapStageRow(stageRow);
}

export async function listPieceOptions(): Promise<PieceOption[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_piece")
    .select("piece_id,piece_code,kanji,name")
    .order("piece_id", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(
    (row): PieceOption => ({
      pieceId: row.piece_id as number,
      pieceCode: row.piece_code as string,
      char: row.kanji as string,
      name: row.name as string,
    }),
  );
}

export async function listStagePieceUsages(): Promise<StagePieceUsageRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_stage_initial_placement")
    .select("stage_id,piece_id");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    stageId: row.stage_id as number,
    pieceId: row.piece_id as number,
  }));
}

export async function listStagePlacementsByStageId(
  stageId: number,
): Promise<StagePlacementRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_stage_initial_placement")
    .select(
      "side,row_no,col_no,piece_id,m_piece:piece_id(piece_code,kanji,name)",
    )
    .eq("stage_id", stageId)
    .order("row_no", { ascending: true })
    .order("col_no", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const piece = firstRelation<{
      piece_code?: string | null;
      kanji?: string | null;
      name?: string | null;
    }>(row.m_piece);

    return {
      side: row.side as "player" | "enemy",
      rowNo: row.row_no as number,
      colNo: row.col_no as number,
      pieceId: row.piece_id as number,
      pieceCode: piece?.piece_code ?? null,
      pieceChar: piece?.kanji ?? null,
      pieceName: piece?.name ?? null,
    };
  });
}
