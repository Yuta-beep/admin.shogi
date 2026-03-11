import {
  RewardOption,
  PieceOption,
  StagePlacementRecord,
  StageRewardRecord,
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
  rewards: Array<{
    rewardId: number;
    rewardTiming: "first_clear" | "clear";
    quantity: number;
    sortOrder?: number;
    isActive?: boolean;
  }>;
};

export type StagePieceUsageRecord = {
  stageId: number;
  pieceId: number;
};

const STAGE_SELECT =
  "stage_id,stage_no,stage_name,unlock_stage_no,difficulty,stage_category,clear_condition_type,clear_condition_params,recommended_power,stamina_cost,is_active,published_at,unpublished_at,created_at,updated_at";
const STAGE_REWARD_SELECT =
  "stage_reward_id,reward_id,reward_timing,quantity,drop_rate,sort_order,is_active,m_reward:reward_id(reward_code,reward_type,reward_name,item_code,piece_id,m_piece:piece_id(kanji,name))";

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

function mapRewardOptionRow(row: Record<string, unknown>): RewardOption {
  const piece = firstRelation<{
    kanji?: string | null;
    name?: string | null;
  }>(row.m_piece);

  return {
    rewardId: row.reward_id as number,
    rewardCode: row.reward_code as string,
    rewardType: row.reward_type as string,
    rewardName: row.reward_name as string,
    itemCode: (row.item_code as string | null) ?? null,
    pieceId: (row.piece_id as number | null) ?? null,
    pieceChar: piece?.kanji ?? null,
    pieceName: piece?.name ?? null,
    isActive: (row.is_active as boolean) ?? true,
  };
}

function mapStageRewardRow(row: Record<string, unknown>): StageRewardRecord {
  const reward = firstRelation<{
    reward_code?: string | null;
    reward_type?: string | null;
    reward_name?: string | null;
    item_code?: string | null;
    piece_id?: number | null;
    m_piece?: unknown;
  }>(row.m_reward);
  const piece = firstRelation<{
    kanji?: string | null;
    name?: string | null;
  }>(reward?.m_piece);

  return {
    stageRewardId: row.stage_reward_id as number,
    rewardId: row.reward_id as number,
    rewardTiming: row.reward_timing as string,
    quantity: row.quantity as number,
    dropRate: (row.drop_rate as number | null) ?? null,
    sortOrder: row.sort_order as number,
    isActive: (row.is_active as boolean) ?? true,
    rewardCode: reward?.reward_code ?? null,
    rewardType: reward?.reward_type ?? null,
    rewardName: reward?.reward_name ?? null,
    itemCode: reward?.item_code ?? null,
    pieceId: reward?.piece_id ?? null,
    pieceChar: piece?.kanji ?? null,
    pieceName: piece?.name ?? null,
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

  if (input.rewards.length > 0) {
    const { error: rewardError } = await supabase
      .schema("master")
      .from("m_stage_reward")
      .insert(
        input.rewards.map((reward, index) => ({
          stage_id: stageId,
          reward_id: reward.rewardId,
          reward_timing: reward.rewardTiming,
          quantity: reward.quantity,
          sort_order: reward.sortOrder ?? index + 1,
          is_active: reward.isActive ?? true,
        })),
      );

    if (rewardError) {
      await supabase
        .schema("master")
        .from("m_stage")
        .delete()
        .eq("stage_id", stageId);
      throw new Error(rewardError.message);
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

export async function listRewardOptions(): Promise<RewardOption[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_reward")
    .select(
      "reward_id,reward_code,reward_type,reward_name,item_code,piece_id,is_active,m_piece:piece_id(kanji,name)",
    )
    .in("reward_type", ["currency", "piece"])
    .order("reward_type", { ascending: true })
    .order("reward_id", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) =>
    mapRewardOptionRow(row as unknown as Record<string, unknown>),
  );
}

export async function listStageRewardsByStageId(
  stageId: number,
): Promise<StageRewardRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_stage_reward")
    .select(STAGE_REWARD_SELECT)
    .eq("stage_id", stageId)
    .in("reward_timing", ["first_clear", "clear"])
    .order("reward_timing", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) =>
    mapStageRewardRow(row as unknown as Record<string, unknown>),
  );
}

export async function replaceStageRewards(
  stageId: number,
  rewards: InsertStageInput["rewards"],
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: deleteError } = await supabase
    .schema("master")
    .from("m_stage_reward")
    .delete()
    .eq("stage_id", stageId)
    .in("reward_timing", ["first_clear", "clear"]);

  if (deleteError) throw new Error(deleteError.message);
  if (rewards.length === 0) return;

  const normalized = rewards.map((reward, index) => ({
    stage_id: stageId,
    reward_id: reward.rewardId,
    reward_timing: reward.rewardTiming,
    quantity: reward.quantity,
    sort_order: reward.sortOrder ?? index + 1,
    is_active: reward.isActive ?? true,
  }));

  const { error: insertError } = await supabase
    .schema("master")
    .from("m_stage_reward")
    .insert(normalized);

  if (insertError) throw new Error(insertError.message);
}
