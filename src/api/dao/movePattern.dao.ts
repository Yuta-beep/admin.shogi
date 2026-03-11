import {
  MovePatternDetail,
  MovePatternOption,
  MovePatternRule,
  MovePatternVector,
} from "@/api/model/piece";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function listMovePatterns(): Promise<MovePatternOption[]> {
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

export async function listMoveVectorsByMovePatternId(
  movePatternId: number,
): Promise<MovePatternVector[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_move_pattern_vector")
    .select("dx,dy,max_step")
    .eq("move_pattern_id", movePatternId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    dx: row.dx as number,
    dy: row.dy as number,
    maxStep: row.max_step as number,
  }));
}

export async function insertMovePatternWithVectors(
  vectors: MovePatternVector[],
  nameHint?: { kanji?: string; name?: string },
  options?: {
    canJump?: boolean;
    constraintsJson?: Record<string, unknown> | null;
    rules?: Array<{
      ruleType: string;
      priority?: number;
      paramsJson?: Record<string, unknown> | null;
    }>;
  },
): Promise<number> {
  if (vectors.length === 0) {
    throw new Error("move vectors are required");
  }

  const supabase = getSupabaseAdminClient();
  const now = Date.now();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  const moveCode = `custom_${now}_${random}`;
  const title = nameHint?.kanji || nameHint?.name || "カスタム";
  const moveName = `${title}移動`;

  const { data: patternData, error: patternError } = await supabase
    .schema("master")
    .from("m_move_pattern")
    .insert({
      move_code: moveCode,
      move_name: moveName,
      can_jump: options?.canJump ?? false,
      constraints_json: options?.constraintsJson ?? null,
    })
    .select("move_pattern_id")
    .single();

  if (patternError) throw new Error(patternError.message);

  const movePatternId = patternData.move_pattern_id as number;
  const uniqVectors = Array.from(
    new Map(
      vectors.map((v) => [`${v.dx}:${v.dy}:${v.maxStep}`, v] as const),
    ).values(),
  );
  const { error: vectorError } = await supabase
    .schema("master")
    .from("m_move_pattern_vector")
    .insert(
      uniqVectors.map((vector) => ({
        move_pattern_id: movePatternId,
        dx: vector.dx,
        dy: vector.dy,
        max_step: vector.maxStep,
      })),
    );

  if (vectorError) {
    await supabase
      .schema("master")
      .from("m_move_pattern")
      .delete()
      .eq("move_pattern_id", movePatternId);
    throw new Error(vectorError.message);
  }

  if (options?.rules && options.rules.length > 0) {
    const { error: ruleError } = await supabase
      .schema("master")
      .from("m_move_pattern_rule")
      .insert(
        options.rules.map((rule, index) => ({
          move_pattern_id: movePatternId,
          rule_type: rule.ruleType,
          priority: Number.isInteger(rule.priority)
            ? rule.priority
            : 100 + index,
          params_json: rule.paramsJson ?? {},
          is_active: true,
        })),
      );

    if (ruleError) {
      await supabase
        .schema("master")
        .from("m_move_pattern")
        .delete()
        .eq("move_pattern_id", movePatternId);
      throw new Error(ruleError.message);
    }
  }

  return movePatternId;
}

export async function updateMovePatternSpecialConfig(
  movePatternId: number,
  input: {
    canJump?: boolean | null;
    constraintsJson?: Record<string, unknown> | null;
    rules?: Array<{
      ruleType: string;
      priority?: number;
      paramsJson?: Record<string, unknown> | null;
    }> | null;
  },
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const updatePayload: Record<string, unknown> = {};
  if (typeof input.canJump === "boolean")
    updatePayload.can_jump = input.canJump;
  if (input.constraintsJson !== undefined) {
    updatePayload.constraints_json = input.constraintsJson ?? null;
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase
      .schema("master")
      .from("m_move_pattern")
      .update(updatePayload)
      .eq("move_pattern_id", movePatternId);
    if (error) throw new Error(error.message);
  }

  if (!input.rules) return;

  const { error: deleteError } = await supabase
    .schema("master")
    .from("m_move_pattern_rule")
    .delete()
    .eq("move_pattern_id", movePatternId);
  if (deleteError) throw new Error(deleteError.message);

  if (input.rules.length === 0) return;

  const { error: insertError } = await supabase
    .schema("master")
    .from("m_move_pattern_rule")
    .insert(
      input.rules.map((rule, index) => ({
        move_pattern_id: movePatternId,
        rule_type: rule.ruleType,
        priority: Number.isInteger(rule.priority) ? rule.priority : 100 + index,
        params_json: rule.paramsJson ?? {},
        is_active: true,
      })),
    );
  if (insertError) throw new Error(insertError.message);
}

export async function getMovePatternDetailById(
  movePatternId: number,
): Promise<MovePatternDetail | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_move_pattern")
    .select(
      "move_pattern_id,move_code,move_name,is_repeatable,can_jump,constraints_json",
    )
    .eq("move_pattern_id", movePatternId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const rules = await listMoveRulesByMovePatternId(movePatternId);
  return {
    id: data.move_pattern_id as number,
    moveCode: data.move_code as string,
    moveName: data.move_name as string,
    isRepeatable: (data.is_repeatable as boolean) ?? false,
    canJump: (data.can_jump as boolean) ?? false,
    constraintsJson:
      (data.constraints_json as Record<string, unknown> | null) ?? null,
    rules,
  };
}

export async function listMoveRulesByMovePatternId(
  movePatternId: number,
): Promise<MovePatternRule[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_move_pattern_rule")
    .select("rule_type,priority,params_json,is_active")
    .eq("move_pattern_id", movePatternId)
    .order("priority", { ascending: true });

  if (error) {
    // Keep admin detail usable even before rule table migration is applied.
    return [];
  }

  return (data ?? [])
    .filter((row) => (row.is_active as boolean | null) !== false)
    .map(
      (row): MovePatternRule => ({
        ruleType: row.rule_type as string,
        priority: (row.priority as number) ?? 100,
        paramsJson: (row.params_json as Record<string, unknown> | null) ?? null,
      }),
    );
}
