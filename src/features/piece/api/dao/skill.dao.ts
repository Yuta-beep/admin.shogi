import { SkillDraftInput } from "@/features/piece/domain/piece.types";
import { getSupabaseAdminClient } from "@/shared/lib/supabase-admin-client";

function generateSkillCode() {
  const time = Date.now().toString(36).toLowerCase();
  const random = Math.random().toString(36).slice(2, 8).toLowerCase();
  return `skill_${time}${random}`;
}

export async function insertSkillWithEffect(input: SkillDraftInput) {
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
      skill_type: "passive",
      target_rule: input.targetRule,
      effect_summary_type: input.effectType,
      proc_chance: input.procChance,
      duration_turns: input.durationTurns,
      params_json: input.paramsJson ?? {},
      parse_status: "manual_admin",
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
