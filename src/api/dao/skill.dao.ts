import {
  SkillDraftInput,
  SkillDraftOptions,
  SkillEffectRecord,
  SkillOption,
} from "@/api/model/piece";
import { getSupabaseAdminClient } from "@/lib/supabase";

function generateSkillCode() {
  const time = Date.now().toString(36).toLowerCase();
  const random = Math.random().toString(36).slice(2, 8).toLowerCase();
  return `skill_${time}${random}`;
}

export async function listSkills(): Promise<SkillOption[]> {
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

export async function insertSkillWithEffect(
  input: SkillDraftInput,
): Promise<number> {
  const supabase = getSupabaseAdminClient();

  const skillCode = generateSkillCode();
  const skillName =
    input.skillDesc.length > 40
      ? `${input.skillDesc.slice(0, 40)}...`
      : input.skillDesc;

  const { data: createdSkill, error: skillError } = await supabase
    .schema("master")
    .from("m_skill")
    .insert({
      skill_code: skillCode,
      skill_name: skillName,
      skill_desc: input.skillDesc,
      trigger_timing: input.triggerTiming,
      is_active: true,
      skill_type: "active_or_passive",
      target_rule: input.targetRule,
      effect_summary_type: "scripted",
      proc_chance: input.procChance,
      duration_turns: input.durationTurns,
      params_json: input.paramsJson ?? {},
      parse_status: "rule_only_v2",
    })
    .select("skill_id")
    .single();

  if (skillError) {
    throw new Error(skillError.message);
  }

  const skillId = createdSkill.skill_id as number;

  const { error: effectError } = await supabase
    .schema("master")
    .from("m_skill_effect")
    .insert({
      skill_id: skillId,
      effect_order: 1,
      effect_type: input.effectType,
      target_rule: input.targetRule,
      trigger_timing: input.triggerTiming,
      proc_chance: input.procChance,
      duration_turns: input.durationTurns,
      radius: input.radius,
      value_num: input.valueNum,
      value_text: input.valueText,
      params_json: input.paramsJson ?? {},
      is_active: true,
    });

  if (effectError) {
    try {
      await supabase
        .schema("master")
        .from("m_skill")
        .delete()
        .eq("skill_id", skillId);
    } catch {
      // Ignore rollback failure and surface the original error.
    }
    throw new Error(effectError.message);
  }

  return skillId;
}
