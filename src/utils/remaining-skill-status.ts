type RemainingSkillState = "implemented" | "script_hook" | "out_of_scope";

type RemainingSkillStatus = {
  state: RemainingSkillState;
  label: string;
};

const REMAINING_SKILL_STATUS_BY_ID: Record<number, RemainingSkillStatus> = {
  98: { state: "out_of_scope", label: "out_of_scope" },
  101: { state: "script_hook", label: "script_hook" },
  102: { state: "implemented", label: "implemented" },
  104: { state: "script_hook", label: "script_hook" },
  105: { state: "implemented", label: "implemented" },
  107: { state: "out_of_scope", label: "out_of_scope" },
  108: { state: "out_of_scope", label: "out_of_scope" },
  109: { state: "out_of_scope", label: "out_of_scope" },
  110: { state: "out_of_scope", label: "out_of_scope" },
  111: { state: "out_of_scope", label: "out_of_scope" },
};

export function getRemainingSkillStatus(skillId: number | null | undefined) {
  if (!skillId) return null;
  return REMAINING_SKILL_STATUS_BY_ID[skillId] ?? null;
}

export function remainingSkillStatusClassName(state: RemainingSkillState) {
  switch (state) {
    case "implemented":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "script_hook":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "out_of_scope":
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}
