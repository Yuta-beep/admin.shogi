import {
  MovePatternVector,
  MovePatternOption,
  PieceFormInput,
  PieceRecord,
  SkillEffectRecord,
  SkillDraftOptions,
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
  const skill = firstRelation<{ skill_desc?: string | null }>(row.m_skill);

  return {
    pieceId: row.piece_id as number,
    pieceCode: row.piece_code as string,
    kanji: row.kanji as string,
    name: row.name as string,
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

export async function listPieces() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_piece")
    .select(
      "piece_id,piece_code,kanji,name,move_pattern_id,skill_id,image_source,image_bucket,image_key,image_version,is_active,published_at,unpublished_at,created_at,updated_at,m_move_pattern:move_pattern_id(move_name),m_skill:skill_id(skill_desc)",
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

export async function listMoveVectorsByMovePatternId(movePatternId: number) {
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

export async function listSkills() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_skill")
    .select(
      "skill_id,skill_code,skill_desc,m_skill_effect(skill_effect_id,effect_order,effect_type,value_text,is_active)",
    )
    .order("skill_id", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(
    (row): SkillOption => ({
      id: row.skill_id as number,
      skillCode: row.skill_code as string,
      skillDesc: row.skill_desc as string,
      effectSummary: (() => {
        const effects = Array.isArray(row.m_skill_effect)
          ? row.m_skill_effect
              .filter(
                (effect) =>
                  (effect as { is_active?: boolean | null }).is_active !==
                  false,
              )
              .sort((a, b) => {
                const ao = (a as { effect_order?: number }).effect_order ?? 999;
                const bo = (b as { effect_order?: number }).effect_order ?? 999;
                return ao - bo;
              })
          : [];
        if (effects.length === 0) return null;
        const first = effects[0] as {
          value_text?: string | null;
          effect_type?: string | null;
        };
        return first.value_text ?? first.effect_type ?? null;
      })(),
      effectCount: Array.isArray(row.m_skill_effect)
        ? row.m_skill_effect.filter(
            (effect) =>
              (effect as { is_active?: boolean | null }).is_active !== false,
          ).length
        : 0,
    }),
  );
}

export async function listSkillDraftOptions(): Promise<SkillDraftOptions> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_skill_effect")
    .select("effect_type,target_rule,trigger_timing,is_active");

  if (error) throw new Error(error.message);

  const effectTypes = new Set<string>();
  const targetRules = new Set<string>();
  const triggerTimings = new Set<string>();

  for (const row of data ?? []) {
    if (row.is_active === false) continue;
    if (typeof row.effect_type === "string" && row.effect_type.trim() !== "") {
      effectTypes.add(row.effect_type.trim());
    }
    if (typeof row.target_rule === "string" && row.target_rule.trim() !== "") {
      targetRules.add(row.target_rule.trim());
    }
    if (
      typeof row.trigger_timing === "string" &&
      row.trigger_timing.trim() !== ""
    ) {
      triggerTimings.add(row.trigger_timing.trim());
    }
  }

  return {
    effectTypes: Array.from(effectTypes).sort((a, b) => a.localeCompare(b)),
    targetRules: Array.from(targetRules).sort((a, b) => a.localeCompare(b)),
    triggerTimings: Array.from(triggerTimings).sort((a, b) =>
      a.localeCompare(b),
    ),
  };
}

export async function getPieceById(pieceId: number) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_piece")
    .select(
      "piece_id,piece_code,kanji,name,move_pattern_id,skill_id,image_source,image_bucket,image_key,image_version,is_active,published_at,unpublished_at,created_at,updated_at,m_move_pattern:move_pattern_id(move_name),m_skill:skill_id(skill_desc)",
    )
    .eq("piece_id", pieceId)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapPieceRow(data as Record<string, unknown>);
}

export async function listSkillEffectsBySkillId(
  skillId: number,
): Promise<SkillEffectRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("master")
    .from("m_skill_effect")
    .select(
      "skill_effect_id,effect_order,effect_type,target_rule,trigger_timing,proc_chance,duration_turns,radius,value_num,value_text,params_json",
    )
    .eq("skill_id", skillId)
    .order("effect_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    skillEffectId: row.skill_effect_id as number,
    effectOrder: (row.effect_order as number) ?? 1,
    effectType: row.effect_type as string,
    targetRule: row.target_rule as string,
    triggerTiming: row.trigger_timing as string,
    procChance: (row.proc_chance as number | null) ?? null,
    durationTurns: (row.duration_turns as number | null) ?? null,
    radius: (row.radius as number | null) ?? null,
    valueNum: (row.value_num as number | null) ?? null,
    valueText: (row.value_text as string | null) ?? null,
    paramsJson: (row.params_json as Record<string, unknown> | null) ?? null,
  }));
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

export async function insertMovePatternWithVectors(
  vectors: MovePatternVector[],
  nameHint?: { kanji?: string; name?: string },
) {
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

  return movePatternId;
}
