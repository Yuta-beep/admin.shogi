import {
  LegacySkillEffectRecord,
  SkillDefinitionRecord,
  SkillDraftInput,
  SkillEffectRecord,
  SkillOption,
  SkillRegistryDocument,
} from "@/api/model/piece";
import { getSupabaseAdminClient } from "@/lib/supabase";

type SkillQueryClient = ReturnType<typeof getSupabaseAdminClient>;

type SkillMetaRow = {
  skill_id: number;
  skill_code: string | null;
  skill_desc: string;
  implementation_kind: string | null;
  trigger_group: string | null;
  trigger_type: string | null;
  source_kind: string | null;
  source_file: string | null;
  source_function: string | null;
  tags_json: unknown;
  script_hook: string | null;
};

type SkillConditionRow = {
  skill_condition_id: number;
  skill_id: number;
  condition_order: number;
  condition_group: string;
  condition_type: string;
  params_json: Record<string, unknown> | null;
  is_active: boolean;
};

type SkillEffectRow = {
  skill_effect_id: number;
  skill_id: number;
  effect_order: number;
  effect_group: string | null;
  effect_type: string;
  target_group: string | null;
  target_selector: string | null;
  target_rule: string;
  trigger_timing: string | null;
  proc_chance: number | null;
  duration_turns: number | null;
  radius: number | null;
  value_num: number | null;
  value_text: string | null;
  params_json: Record<string, unknown> | null;
  is_active: boolean;
};

type SkillRegistryGroupRow = {
  schema_kind: string;
  group_code: string;
  group_name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type SkillRegistryOptionRow = {
  schema_kind: string;
  group_code: string;
  option_code: string;
  option_name: string;
  description: string | null;
  value_type: string | null;
  sort_order: number;
  is_script_only: boolean;
  is_active: boolean;
};

type SkillImplementationKindRow = {
  implementation_kind: string;
  display_name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

let registryCache: Promise<SkillRegistryDocument> | null = null;

function clientOf(client?: SkillQueryClient) {
  return client ?? getSupabaseAdminClient();
}

function generateSkillCode() {
  const time = Date.now().toString(36).toLowerCase();
  const random = Math.random().toString(36).slice(2, 8).toLowerCase();
  return `skill_${time}${random}`;
}

function isSkillV2Ready(row: SkillMetaRow) {
  return Boolean(row.implementation_kind && row.trigger_group && row.trigger_type);
}

function normalizeTagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function createLabelMaps(registry: SkillRegistryDocument) {
  const implementationKinds = new Map(
    registry.implementationKinds.map((kind) => [kind.code, kind.name]),
  );
  const groups = new Map<string, string>();
  const options = new Map<string, string>();

  for (const [schemaKind, spec] of Object.entries(registry.registries)) {
    for (const group of spec.groups) {
      groups.set(`${schemaKind}:${group.groupCode}`, group.groupName);
      for (const option of group.options) {
        options.set(`${schemaKind}:${option.optionCode}`, option.optionName);
      }
    }
  }

  return { implementationKinds, groups, options };
}

function getSummaryFromSkill(
  row: SkillMetaRow,
  readyEffects: SkillEffectRow[],
  legacyEffects: SkillEffectRow[],
) {
  if (row.script_hook) {
    return `script_hook:${row.script_hook}`;
  }
  const firstReady = readyEffects[0];
  if (firstReady) {
    return `${firstReady.effect_type} -> ${firstReady.target_selector ?? "unknown"}`;
  }
  const firstLegacy = legacyEffects[0];
  if (firstLegacy) {
    return firstLegacy.value_text ?? firstLegacy.effect_type ?? null;
  }
  return null;
}

function toLegacyEffectRecord(effect: SkillEffectRow): LegacySkillEffectRecord {
  return {
    skillEffectId: effect.skill_effect_id,
    effectOrder: effect.effect_order,
    effectType: effect.effect_type,
    targetRule: effect.target_rule,
    triggerTiming: effect.trigger_timing,
    procChance: effect.proc_chance,
    durationTurns: effect.duration_turns,
    radius: effect.radius,
    valueNum: effect.value_num,
    valueText: effect.value_text,
    paramsJson: effect.params_json ?? {},
  };
}

function toV2EffectRecord(
  effect: SkillEffectRow,
  labelMaps: ReturnType<typeof createLabelMaps>,
): SkillEffectRecord | null {
  if (!effect.effect_group || !effect.target_group || !effect.target_selector) {
    return null;
  }

  return {
    skillEffectId: effect.skill_effect_id,
    effectOrder: effect.effect_order,
    effectGroup: effect.effect_group,
    effectType: effect.effect_type,
    targetGroup: effect.target_group,
    targetSelector: effect.target_selector,
    paramsJson: effect.params_json ?? {},
    groupName:
      labelMaps.groups.get(`effect:${effect.effect_group}`) ?? effect.effect_group,
    typeName:
      labelMaps.options.get(`effect:${effect.effect_type}`) ?? effect.effect_type,
    targetGroupName:
      labelMaps.groups.get(`target:${effect.target_group}`) ?? effect.target_group,
    targetSelectorName:
      labelMaps.options.get(`target:${effect.target_selector}`) ??
      effect.target_selector,
  };
}

function extractProcChance(input: SkillDraftInput) {
  const probabilityCondition = input.conditions.find(
    (condition) => condition.group === "probability" && condition.type === "chance_roll",
  );
  const value = probabilityCondition?.paramsJson.procChance;
  return typeof value === "number" ? value : null;
}

function extractNumericParam(params: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === "number") return value;
  }
  return null;
}

function extractStringParam(params: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

function buildSkillDefinitionRecord(
  row: SkillMetaRow,
  conditionRows: SkillConditionRow[],
  effectRows: SkillEffectRow[],
  registry: SkillRegistryDocument,
): SkillDefinitionRecord {
  const labelMaps = createLabelMaps(registry);
  const readyEffects = effectRows
    .filter(
      (effect) =>
        effect.is_active !== false &&
        effect.effect_group &&
        effect.target_group &&
        effect.target_selector,
    )
    .sort((a, b) => a.effect_order - b.effect_order);
  const legacyEffects = effectRows
    .filter((effect) => effect.is_active !== false)
    .sort((a, b) => a.effect_order - b.effect_order);
  const version =
    isSkillV2Ready(row) && (row.implementation_kind === "script_hook" || readyEffects.length >= 0)
      ? "v2"
      : "legacy";

  return {
    skillId: row.skill_id,
    skillCode: row.skill_code ?? `skill_${row.skill_id}`,
    skillDesc: row.skill_desc,
    version,
    implementationKind: row.implementation_kind,
    implementationKindName: row.implementation_kind
      ? labelMaps.implementationKinds.get(row.implementation_kind) ?? row.implementation_kind
      : null,
    trigger: {
      group: row.trigger_group,
      type: row.trigger_type,
      groupName: row.trigger_group
        ? labelMaps.groups.get(`trigger:${row.trigger_group}`) ?? row.trigger_group
        : null,
      typeName: row.trigger_type
        ? labelMaps.options.get(`trigger:${row.trigger_type}`) ?? row.trigger_type
        : null,
    },
    source: {
      kind: row.source_kind,
      file: row.source_file,
      functionName: row.source_function,
    },
    tags: normalizeTagList(row.tags_json),
    scriptHook: row.script_hook,
    conditions:
      version === "v2"
        ? conditionRows
            .filter((condition) => condition.is_active !== false)
            .sort((a, b) => a.condition_order - b.condition_order)
            .map((condition) => ({
              skillConditionId: condition.skill_condition_id,
              order: condition.condition_order,
              group: condition.condition_group,
              type: condition.condition_type,
              paramsJson: condition.params_json ?? {},
              groupName:
                labelMaps.groups.get(`condition:${condition.condition_group}`) ??
                condition.condition_group,
              typeName:
                labelMaps.options.get(`condition:${condition.condition_type}`) ??
                condition.condition_type,
            }))
        : [],
    effects:
      version === "v2"
        ? readyEffects
            .map((effect) => toV2EffectRecord(effect, labelMaps))
            .filter((effect): effect is SkillEffectRecord => Boolean(effect))
        : [],
    legacyEffects: version === "legacy" ? legacyEffects.map(toLegacyEffectRecord) : [],
  };
}

export async function listSkillRegistry(): Promise<SkillRegistryDocument> {
  return listSkillRegistryWithClient(clientOf(), true);
}

export async function listSkillRegistryWithClient(
  client: SkillQueryClient,
  useCache = false,
): Promise<SkillRegistryDocument> {
  if (!useCache) {
    return fetchSkillRegistry(client);
  }

  if (!registryCache) {
    registryCache = fetchSkillRegistry(client);
  }

  return registryCache;
}

async function fetchSkillRegistry(
  client: SkillQueryClient,
): Promise<SkillRegistryDocument> {
  const [kindRes, groupRes, optionRes] = await Promise.all([
    client
      .schema("master")
      .from("m_skill_implementation_kind")
      .select("implementation_kind,display_name,description,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    client
      .schema("master")
      .from("m_skill_schema_group")
      .select("schema_kind,group_code,group_name,description,sort_order,is_active")
      .eq("is_active", true)
      .order("schema_kind", { ascending: true })
      .order("sort_order", { ascending: true }),
    client
      .schema("master")
      .from("m_skill_schema_option")
      .select(
        "schema_kind,group_code,option_code,option_name,description,value_type,sort_order,is_script_only,is_active",
      )
      .eq("is_active", true)
      .order("schema_kind", { ascending: true })
      .order("group_code", { ascending: true })
      .order("sort_order", { ascending: true }),
  ]);

  if (kindRes.error) throw new Error(kindRes.error.message);
  if (groupRes.error) throw new Error(groupRes.error.message);
  if (optionRes.error) throw new Error(optionRes.error.message);

  const groupRows = (groupRes.data ?? []) as SkillRegistryGroupRow[];
  const optionRows = (optionRes.data ?? []) as SkillRegistryOptionRow[];

  const groupsBySchema = new Map<
    string,
    Array<{
      groupCode: string;
      groupName: string;
      description: string;
      options: Array<{
        optionCode: string;
        optionName: string;
        description: string;
        valueType?: string;
      }>;
    }>
  >();

  for (const group of groupRows) {
    const list = groupsBySchema.get(group.schema_kind) ?? [];
    list.push({
      groupCode: group.group_code,
      groupName: group.group_name,
      description: group.description ?? "",
      options: optionRows
        .filter(
          (option) =>
            option.schema_kind === group.schema_kind &&
            option.group_code === group.group_code,
        )
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => ({
          optionCode: option.option_code,
          optionName: option.option_name,
          description: option.description ?? "",
          ...(option.value_type ? { valueType: option.value_type } : {}),
        })),
    });
    groupsBySchema.set(group.schema_kind, list);
  }

  return {
    version: "skill-registry-v2-db",
    updatedAt: new Date().toISOString(),
    implementationKinds: ((kindRes.data ?? []) as SkillImplementationKindRow[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((kind) => ({
        code: kind.implementation_kind,
        name: kind.display_name,
        description: kind.description,
      })),
    registries: {
      trigger: { groups: groupsBySchema.get("trigger") ?? [] },
      target: { groups: groupsBySchema.get("target") ?? [] },
      effect: { groups: groupsBySchema.get("effect") ?? [] },
      condition: { groups: groupsBySchema.get("condition") ?? [] },
      param: { groups: groupsBySchema.get("param") ?? [] },
    },
  };
}

export function resetSkillRegistryCacheForTests() {
  registryCache = null;
}

export async function listSkills(): Promise<SkillOption[]> {
  return listSkillsWithClient(clientOf());
}

export async function listSkillsWithClient(
  client: SkillQueryClient,
): Promise<SkillOption[]> {
  await listSkillRegistryWithClient(client);
  const { data: skillRows, error: skillError } = await client
    .schema("master")
    .from("m_skill")
    .select(
      "skill_id,skill_code,skill_desc,implementation_kind,trigger_group,trigger_type,source_kind,source_file,source_function,tags_json,script_hook",
    )
    .order("skill_id", { ascending: true });

  if (skillError) throw new Error(skillError.message);

  const rows = (skillRows ?? []) as SkillMetaRow[];
  const skillIds = rows.map((row) => row.skill_id);
  if (skillIds.length === 0) return [];

  const [{ data: conditionRows, error: conditionError }, { data: effectRows, error: effectError }] =
    await Promise.all([
      client
        .schema("master")
        .from("m_skill_condition")
        .select(
          "skill_condition_id,skill_id,condition_order,condition_group,condition_type,params_json,is_active",
        )
        .eq("is_active", true)
        .in("skill_id", skillIds)
        .order("skill_id", { ascending: true })
        .order("condition_order", { ascending: true }),
      client
        .schema("master")
        .from("m_skill_effect")
        .select(
          "skill_effect_id,skill_id,effect_order,effect_group,effect_type,target_group,target_selector,target_rule,trigger_timing,proc_chance,duration_turns,radius,value_num,value_text,params_json,is_active",
        )
        .eq("is_active", true)
        .in("skill_id", skillIds)
        .order("skill_id", { ascending: true })
        .order("effect_order", { ascending: true }),
    ]);

  if (conditionError) throw new Error(conditionError.message);
  if (effectError) throw new Error(effectError.message);

  return rows.map((row) => {
    const skillConditions = ((conditionRows ?? []) as SkillConditionRow[]).filter(
      (condition) => condition.skill_id === row.skill_id,
    );
    const skillEffects = ((effectRows ?? []) as SkillEffectRow[]).filter(
      (effect) => effect.skill_id === row.skill_id,
    );
    const readyEffects = skillEffects.filter(
      (effect) =>
        effect.effect_group && effect.target_group && effect.target_selector,
    );
    const version = isSkillV2Ready(row) ? "v2" : "legacy";

    return {
      id: row.skill_id,
      skillCode: row.skill_code ?? `skill_${row.skill_id}`,
      skillDesc: row.skill_desc,
      version,
      implementationKind: row.implementation_kind,
      triggerGroup: row.trigger_group,
      triggerType: row.trigger_type,
      effectSummary: getSummaryFromSkill(row, readyEffects, skillEffects),
      effectCount: version === "v2" ? readyEffects.length : skillEffects.length,
      conditionCount: version === "v2" ? skillConditions.length : 0,
      scriptHook: row.script_hook,
      hasScriptHook: Boolean(row.script_hook),
      tags: normalizeTagList(row.tags_json),
    };
  });
}

export async function getSkillDefinitionBySkillId(
  skillId: number,
): Promise<SkillDefinitionRecord | null> {
  return getSkillDefinitionBySkillIdWithClient(clientOf(), skillId);
}

export async function getSkillDefinitionBySkillIdWithClient(
  client: SkillQueryClient,
  skillId: number,
): Promise<SkillDefinitionRecord | null> {
  const registry = await listSkillRegistryWithClient(client);
  const { data: skillRow, error: skillError } = await client
    .schema("master")
    .from("m_skill")
    .select(
      "skill_id,skill_code,skill_desc,implementation_kind,trigger_group,trigger_type,source_kind,source_file,source_function,tags_json,script_hook",
    )
    .eq("skill_id", skillId)
    .limit(1)
    .maybeSingle();

  if (skillError) throw new Error(skillError.message);
  if (!skillRow) return null;

  const [{ data: conditionRows, error: conditionError }, { data: effectRows, error: effectError }] =
    await Promise.all([
      client
        .schema("master")
        .from("m_skill_condition")
        .select(
          "skill_condition_id,skill_id,condition_order,condition_group,condition_type,params_json,is_active",
        )
        .eq("skill_id", skillId)
        .eq("is_active", true)
        .order("condition_order", { ascending: true }),
      client
        .schema("master")
        .from("m_skill_effect")
        .select(
          "skill_effect_id,skill_id,effect_order,effect_group,effect_type,target_group,target_selector,target_rule,trigger_timing,proc_chance,duration_turns,radius,value_num,value_text,params_json,is_active",
        )
        .eq("skill_id", skillId)
        .eq("is_active", true)
        .order("effect_order", { ascending: true }),
    ]);

  if (conditionError) throw new Error(conditionError.message);
  if (effectError) throw new Error(effectError.message);

  return buildSkillDefinitionRecord(
    skillRow as SkillMetaRow,
    (conditionRows ?? []) as SkillConditionRow[],
    (effectRows ?? []) as SkillEffectRow[],
    registry,
  );
}

async function insertSkillDefinitionV2WithClient(
  client: SkillQueryClient,
  input: SkillDraftInput,
): Promise<number> {
  const skillCode = generateSkillCode();
  const skillName =
    input.skillDesc.length > 40
      ? `${input.skillDesc.slice(0, 40)}...`
      : input.skillDesc;
  const procChance = extractProcChance(input);
  const firstEffect = input.effects[0] ?? null;
  const firstParams = firstEffect?.paramsJson ?? {};

  const { data: createdSkill, error: skillError } = await client
    .schema("master")
    .from("m_skill")
    .insert({
      skill_code: skillCode,
      skill_name: skillName,
      skill_desc: input.skillDesc,
      trigger_timing: input.trigger.type,
      is_active: true,
      skill_type: "active_or_passive",
      target_rule: firstEffect?.target.selector ?? "unspecified",
      effect_summary_type:
        input.implementationKind === "script_hook" ? "scripted" : "structured_v2",
      proc_chance: procChance,
      duration_turns: extractNumericParam(firstParams, "durationTurns", "duration"),
      params_json: {
        source: "admin.shogi",
        schemaVersion: "skill_v2",
      },
      parse_status: "rule_only_v2",
      implementation_kind: input.implementationKind,
      trigger_group: input.trigger.group,
      trigger_type: input.trigger.type,
      source_kind: input.sourceKind,
      source_file: input.sourceFile,
      source_function: input.sourceFunction,
      tags_json: input.tags,
      script_hook: input.scriptHook,
    })
    .select("skill_id")
    .single();

  if (skillError) throw new Error(skillError.message);

  const skillId = createdSkill.skill_id as number;

  if (input.conditions.length > 0) {
    const { error: conditionError } = await client
      .schema("master")
      .from("m_skill_condition")
      .insert(
        input.conditions.map((condition, index) => ({
          skill_id: skillId,
          condition_order: index + 1,
          condition_group: condition.group,
          condition_type: condition.type,
          params_json: condition.paramsJson,
          is_active: true,
        })),
      );

    if (conditionError) {
      await client.schema("master").from("m_skill").delete().eq("skill_id", skillId);
      throw new Error(conditionError.message);
    }
  }

  if (input.effects.length > 0) {
    const { error: effectError } = await client
      .schema("master")
      .from("m_skill_effect")
      .insert(
        input.effects.map((effect, index) => ({
          skill_id: skillId,
          effect_order: index + 1,
          effect_group: effect.group,
          effect_type: effect.type,
          target_group: effect.target.group,
          target_selector: effect.target.selector,
          target_rule: effect.target.selector,
          trigger_timing: input.trigger.type,
          proc_chance: procChance,
          duration_turns: extractNumericParam(
            effect.paramsJson,
            "durationTurns",
            "duration",
          ),
          radius: extractNumericParam(effect.paramsJson, "radius"),
          value_num: extractNumericParam(
            effect.paramsJson,
            "valueNum",
            "count",
            "amount",
          ),
          value_text: extractStringParam(
            effect.paramsJson,
            "valueText",
            "status",
            "movementRule",
            "pieceCode",
          ),
          params_json: effect.paramsJson,
          is_active: true,
        })),
      );

    if (effectError) {
      await client.schema("master").from("m_skill").delete().eq("skill_id", skillId);
      throw new Error(effectError.message);
    }
  }

  return skillId;
}

export async function insertSkillDefinitionV2(
  input: SkillDraftInput,
): Promise<number> {
  return insertSkillDefinitionV2WithClient(clientOf(), input);
}

export async function updateSkillDefinitionV2(
  skillId: number,
  input: SkillDraftInput,
): Promise<number> {
  return updateSkillDefinitionV2WithClient(clientOf(), skillId, input);
}

export async function updateSkillDefinitionV2WithClient(
  client: SkillQueryClient,
  skillId: number,
  input: SkillDraftInput,
): Promise<number> {
  const procChance = extractProcChance(input);
  const firstEffect = input.effects[0] ?? null;
  const firstParams = firstEffect?.paramsJson ?? {};

  const { error: updateError } = await client
    .schema("master")
    .from("m_skill")
    .update({
      skill_desc: input.skillDesc,
      trigger_timing: input.trigger.type,
      target_rule: firstEffect?.target.selector ?? "unspecified",
      effect_summary_type:
        input.implementationKind === "script_hook" ? "scripted" : "structured_v2",
      proc_chance: procChance,
      duration_turns: extractNumericParam(firstParams, "durationTurns", "duration"),
      params_json: {
        source: "admin.shogi",
        schemaVersion: "skill_v2",
      },
      parse_status: "rule_only_v2",
      implementation_kind: input.implementationKind,
      trigger_group: input.trigger.group,
      trigger_type: input.trigger.type,
      source_kind: input.sourceKind,
      source_file: input.sourceFile,
      source_function: input.sourceFunction,
      tags_json: input.tags,
      script_hook: input.scriptHook,
    })
    .eq("skill_id", skillId);

  if (updateError) throw new Error(updateError.message);

  const { error: deleteConditionError } = await client
    .schema("master")
    .from("m_skill_condition")
    .delete()
    .eq("skill_id", skillId);
  if (deleteConditionError) throw new Error(deleteConditionError.message);

  const { error: deleteEffectError } = await client
    .schema("master")
    .from("m_skill_effect")
    .delete()
    .eq("skill_id", skillId);
  if (deleteEffectError) throw new Error(deleteEffectError.message);

  if (input.conditions.length > 0) {
    const { error: conditionError } = await client
      .schema("master")
      .from("m_skill_condition")
      .insert(
        input.conditions.map((condition, index) => ({
          skill_id: skillId,
          condition_order: index + 1,
          condition_group: condition.group,
          condition_type: condition.type,
          params_json: condition.paramsJson,
          is_active: true,
        })),
      );
    if (conditionError) throw new Error(conditionError.message);
  }

  if (input.effects.length > 0) {
    const { error: effectError } = await client
      .schema("master")
      .from("m_skill_effect")
      .insert(
        input.effects.map((effect, index) => ({
          skill_id: skillId,
          effect_order: index + 1,
          effect_group: effect.group,
          effect_type: effect.type,
          target_group: effect.target.group,
          target_selector: effect.target.selector,
          target_rule: effect.target.selector,
          trigger_timing: input.trigger.type,
          proc_chance: procChance,
          duration_turns: extractNumericParam(
            effect.paramsJson,
            "durationTurns",
            "duration",
          ),
          radius: extractNumericParam(effect.paramsJson, "radius"),
          value_num: extractNumericParam(
            effect.paramsJson,
            "valueNum",
            "count",
            "amount",
          ),
          value_text: extractStringParam(
            effect.paramsJson,
            "valueText",
            "status",
            "movementRule",
            "pieceCode",
          ),
          params_json: effect.paramsJson,
          is_active: true,
        })),
      );
    if (effectError) throw new Error(effectError.message);
  }

  return skillId;
}

export { insertSkillDefinitionV2WithClient };
