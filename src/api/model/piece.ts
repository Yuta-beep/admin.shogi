export type PieceRecord = {
  pieceId: number;
  pieceCode: string;
  kanji: string;
  name: string;
  rarity: "N" | "R" | "SR" | "UR" | "SSR";
  moveDescriptionJa: string | null;
  movePatternId: number;
  movePatternName: string | null;
  skillId: number | null;
  skillDesc: string | null;
  imageSource: string;
  imageBucket: string | null;
  imageKey: string | null;
  imageVersion: number;
  isActive: boolean;
  publishedAt: string | null;
  unpublishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SkillSchemaKind =
  | "trigger"
  | "target"
  | "effect"
  | "condition"
  | "param";

export type SkillImplementationKind = {
  code: string;
  name: string;
  description: string;
};

export type SkillRegistryOption = {
  optionCode: string;
  optionName: string;
  description: string;
  valueType?: string;
};

export type SkillRegistryGroup = {
  groupCode: string;
  groupName: string;
  description: string;
  options: SkillRegistryOption[];
};

export type SkillRegistryDocument = {
  version: string;
  updatedAt: string;
  implementationKinds: SkillImplementationKind[];
  registries: Record<SkillSchemaKind, { groups: SkillRegistryGroup[] }>;
};

export type MovePatternVector = {
  dx: number;
  dy: number;
  maxStep: number;
};

export type MovePatternRule = {
  ruleType: string;
  priority: number;
  paramsJson: Record<string, unknown> | null;
};

export type MovePatternDetail = {
  id: number;
  moveCode: string;
  moveName: string;
  isRepeatable: boolean;
  canJump: boolean;
  constraintsJson: Record<string, unknown> | null;
  rules: MovePatternRule[];
};

export type MovePatternOption = {
  id: number;
  moveCode: string;
  moveName: string;
  vectors: MovePatternVector[];
};

export type SkillOption = {
  id: number;
  skillCode: string;
  skillDesc: string;
  version: "v2" | "legacy";
  implementationKind: string | null;
  triggerGroup: string | null;
  triggerType: string | null;
  effectSummary: string | null;
  effectCount: number;
  conditionCount: number;
  scriptHook: string | null;
  hasScriptHook: boolean;
  tags: string[];
};

export type SkillTriggerRecord = {
  group: string | null;
  type: string | null;
  groupName: string | null;
  typeName: string | null;
};

export type SkillConditionRecord = {
  skillConditionId: number | null;
  order: number;
  group: string;
  type: string;
  paramsJson: Record<string, unknown> | null;
  groupName: string | null;
  typeName: string | null;
};

export type SkillEffectRecord = {
  skillEffectId: number | null;
  effectOrder: number;
  effectGroup: string;
  effectType: string;
  targetGroup: string;
  targetSelector: string;
  paramsJson: Record<string, unknown> | null;
  groupName: string | null;
  typeName: string | null;
  targetGroupName: string | null;
  targetSelectorName: string | null;
};

export type LegacySkillEffectRecord = {
  skillEffectId: number;
  effectOrder: number;
  effectType: string;
  targetRule: string;
  triggerTiming: string | null;
  procChance: number | null;
  durationTurns: number | null;
  radius: number | null;
  valueNum: number | null;
  valueText: string | null;
  paramsJson: Record<string, unknown> | null;
};

export type SkillDefinitionRecord = {
  skillId: number;
  skillCode: string;
  skillDesc: string;
  version: "v2" | "legacy";
  implementationKind: string | null;
  implementationKindName: string | null;
  trigger: SkillTriggerRecord;
  source: {
    kind: string | null;
    file: string | null;
    functionName: string | null;
  };
  tags: string[];
  scriptHook: string | null;
  conditions: SkillConditionRecord[];
  effects: SkillEffectRecord[];
  legacyEffects: LegacySkillEffectRecord[];
};

export type SkillDraftConditionInput = {
  order: number;
  group: string;
  type: string;
  paramsJson: Record<string, unknown>;
};

export type SkillDraftEffectInput = {
  order: number;
  group: string;
  type: string;
  target: {
    group: string;
    selector: string;
  };
  paramsJson: Record<string, unknown>;
};

export type SkillDraftInput = {
  skillId?: number | null;
  skillDesc: string;
  implementationKind: string;
  trigger: {
    group: string;
    type: string;
  };
  conditions: SkillDraftConditionInput[];
  effects: SkillDraftEffectInput[];
  scriptHook: string | null;
  tags: string[];
  sourceKind: "piece_info" | "deck_builder" | "online_battle" | "manual";
  sourceFile: string | null;
  sourceFunction: string | null;
};
