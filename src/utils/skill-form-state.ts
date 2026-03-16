import {
  SkillDefinitionRecord,
  SkillDraftConditionInput,
  SkillDraftEffectInput,
  SkillDraftInput,
} from "@/api/model/piece";

export type SkillDraftConditionFormState = {
  clientKey: string;
  group: string;
  type: string;
  paramsJson: string;
};

export type SkillDraftEffectFormState = {
  clientKey: string;
  group: string;
  type: string;
  targetGroup: string;
  targetSelector: string;
  paramsJson: string;
};

export type SkillDraftFormValues = {
  skillDesc: string;
  implementationKind: string;
  triggerGroup: string;
  triggerType: string;
  scriptHook: string;
  tagsCsv: string;
  conditions: SkillDraftConditionFormState[];
  effects: SkillDraftEffectFormState[];
};

let formRowCounter = 0;

function nextClientKey(prefix: string) {
  formRowCounter += 1;
  return `${prefix}_${formRowCounter}`;
}

function stringifyJson(value: Record<string, unknown> | null | undefined) {
  if (!value || Object.keys(value).length === 0) return "{}";
  return JSON.stringify(value, null, 2);
}

export function createEmptySkillDraftConditionFormState(
  partial?: Partial<SkillDraftConditionFormState>,
): SkillDraftConditionFormState {
  return {
    clientKey: partial?.clientKey ?? nextClientKey("condition"),
    group: partial?.group ?? "",
    type: partial?.type ?? "",
    paramsJson: partial?.paramsJson ?? "{}",
  };
}

export function createEmptySkillDraftEffectFormState(
  partial?: Partial<SkillDraftEffectFormState>,
): SkillDraftEffectFormState {
  return {
    clientKey: partial?.clientKey ?? nextClientKey("effect"),
    group: partial?.group ?? "",
    type: partial?.type ?? "",
    targetGroup: partial?.targetGroup ?? "",
    targetSelector: partial?.targetSelector ?? "",
    paramsJson: partial?.paramsJson ?? "{}",
  };
}

export function createEmptySkillDraftFormValues(): SkillDraftFormValues {
  return {
    skillDesc: "",
    implementationKind: "",
    triggerGroup: "",
    triggerType: "",
    scriptHook: "",
    tagsCsv: "",
    conditions: [createEmptySkillDraftConditionFormState()],
    effects: [createEmptySkillDraftEffectFormState()],
  };
}

export function buildSkillDraftFormValuesFromDefinition(
  definition: SkillDefinitionRecord | null,
): SkillDraftFormValues {
  if (!definition || definition.version !== "v2") {
    return createEmptySkillDraftFormValues();
  }

  return {
    skillDesc: definition.skillDesc,
    implementationKind: definition.implementationKind ?? "",
    triggerGroup: definition.trigger.group ?? "",
    triggerType: definition.trigger.type ?? "",
    scriptHook: definition.scriptHook ?? "",
    tagsCsv: definition.tags.join(", "),
    conditions:
      definition.conditions.length > 0
        ? definition.conditions.map((condition) =>
            createEmptySkillDraftConditionFormState({
              group: condition.group,
              type: condition.type,
              paramsJson: stringifyJson(condition.paramsJson),
            }),
          )
        : [createEmptySkillDraftConditionFormState()],
    effects:
      definition.effects.length > 0
        ? definition.effects.map((effect) =>
            createEmptySkillDraftEffectFormState({
              group: effect.effectGroup,
              type: effect.effectType,
              targetGroup: effect.targetGroup,
              targetSelector: effect.targetSelector,
              paramsJson: stringifyJson(effect.paramsJson),
            }),
          )
        : [createEmptySkillDraftEffectFormState()],
  };
}

function parseJsonObject(raw: string, fieldName: string, index: number) {
  const trimmed = raw.trim();
  if (trimmed === "") return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${fieldName}[${index}] paramsJson must be valid JSON`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${fieldName}[${index}] paramsJson must be a JSON object`);
  }

  return parsed as Record<string, unknown>;
}

export function buildSkillDraftInputFromFormValues(
  values: SkillDraftFormValues,
): SkillDraftInput {
  const skillDesc = values.skillDesc.trim();
  const implementationKind = values.implementationKind.trim();
  const triggerGroup = values.triggerGroup.trim();
  const triggerType = values.triggerType.trim();
  const scriptHook = values.scriptHook.trim();

  if (!skillDesc) throw new Error("skillDesc is required when creating skill");
  if (!implementationKind) {
    throw new Error("implementationKind is required when creating skill");
  }
  if (!triggerGroup) {
    throw new Error("skillTriggerGroup is required when creating skill");
  }
  if (!triggerType) {
    throw new Error("skillTriggerType is required when creating skill");
  }

  const conditions: SkillDraftConditionInput[] = values.conditions
    .filter((condition) => condition.group.trim() || condition.type.trim())
    .map((condition, index) => {
      const group = condition.group.trim();
      const type = condition.type.trim();
      if (!group) {
        throw new Error(`skillConditionsJson[${index}] group is required`);
      }
      if (!type) {
        throw new Error(`skillConditionsJson[${index}] type is required`);
      }
      return {
        order: index + 1,
        group,
        type,
        paramsJson: parseJsonObject(
          condition.paramsJson,
          "skillConditionsJson",
          index,
        ),
      };
    });

  const effects: SkillDraftEffectInput[] = values.effects
    .filter(
      (effect) =>
        effect.group.trim() ||
        effect.type.trim() ||
        effect.targetGroup.trim() ||
        effect.targetSelector.trim(),
    )
    .map((effect, index) => {
      const group = effect.group.trim();
      const type = effect.type.trim();
      const targetGroup = effect.targetGroup.trim();
      const targetSelector = effect.targetSelector.trim();

      if (!group) {
        throw new Error(`skillEffectsJson[${index}] group is required`);
      }
      if (!type) {
        throw new Error(`skillEffectsJson[${index}] type is required`);
      }
      if (!targetGroup) {
        throw new Error(`skillEffectsJson[${index}] targetGroup is required`);
      }
      if (!targetSelector) {
        throw new Error(
          `skillEffectsJson[${index}] targetSelector is required`,
        );
      }

      return {
        order: index + 1,
        group,
        type,
        target: {
          group: targetGroup,
          selector: targetSelector,
        },
        paramsJson: parseJsonObject(
          effect.paramsJson,
          "skillEffectsJson",
          index,
        ),
      };
    });

  if (implementationKind === "script_hook") {
    if (!scriptHook) {
      throw new Error("scriptHook is required for script_hook skill");
    }
  } else if (effects.length === 0) {
    throw new Error("at least one effect is required when creating skill");
  }

  return {
    skillDesc,
    implementationKind,
    trigger: {
      group: triggerGroup,
      type: triggerType,
    },
    conditions,
    effects,
    scriptHook: scriptHook || null,
    tags: values.tagsCsv
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0),
    sourceKind: "manual",
    sourceFile: null,
    sourceFunction: null,
  };
}
