import { describe, expect, it } from "bun:test";

import {
  buildSkillDraftFormValuesFromDefinition,
  buildSkillDraftInputFromFormValues,
} from "@/utils/skill-form-state";

describe("skill-form-state", () => {
  it("maps v2 definition to editable form values", () => {
    const values = buildSkillDraftFormValuesFromDefinition({
      skillId: 65,
      skillCode: "skill_65",
      skillDesc: "移動時に押し出す",
      version: "v2",
      implementationKind: "primitive",
      implementationKindName: "Primitive",
      trigger: {
        group: "event_move",
        type: "after_move",
        groupName: "移動イベント",
        typeName: "移動後",
      },
      source: { kind: "manual", file: null, functionName: null },
      tags: ["move_trigger", "adjacent"],
      scriptHook: null,
      conditions: [
        {
          skillConditionId: 1,
          order: 1,
          group: "probability",
          type: "chance_roll",
          paramsJson: { procChance: 0.2 },
          groupName: "確率",
          typeName: "抽選",
        },
      ],
      effects: [
        {
          skillEffectId: 1,
          effectOrder: 1,
          effectGroup: "piece_position",
          effectType: "forced_move",
          targetGroup: "adjacent",
          targetSelector: "adjacent_enemy",
          paramsJson: { movementRule: "push_away", radius: 1 },
          groupName: "位置",
          typeName: "強制移動",
          targetGroupName: "隣接",
          targetSelectorName: "隣接敵",
        },
      ],
      legacyEffects: [],
    });

    expect(values.skillDesc).toBe("移動時に押し出す");
    expect(values.implementationKind).toBe("primitive");
    expect(values.triggerGroup).toBe("event_move");
    expect(values.conditions).toHaveLength(1);
    expect(values.effects).toHaveLength(1);
  });

  it("builds draft input and enforces script_hook rules", () => {
    const draft = buildSkillDraftInputFromFormValues({
      skillDesc: "専用フック",
      implementationKind: "script_hook",
      triggerGroup: "special",
      triggerType: "script_hook",
      scriptHook: "reflect_until_blocked",
      tagsCsv: "special,hook",
      conditions: [],
      effects: [],
    });

    expect(draft.implementationKind).toBe("script_hook");
    expect(draft.scriptHook).toBe("reflect_until_blocked");
    expect(draft.effects).toEqual([]);
    expect(draft.tags).toEqual(["special", "hook"]);
  });
});
