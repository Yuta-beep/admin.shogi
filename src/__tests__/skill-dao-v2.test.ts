import { describe, expect, it } from "bun:test";

import {
  listSkillRegistryWithClient,
  listSkillsWithClient,
  resetSkillRegistryCacheForTests,
} from "@/api/dao/skill.dao";

type TableResult = {
  data: unknown[];
  error: null;
};

function createMockClient(results: Record<string, TableResult>) {
  return {
    schema() {
      return {
        from(table: string) {
          const result = results[table] ?? { data: [], error: null };
          const query = {
            select() {
              return query;
            },
            eq() {
              return query;
            },
            in() {
              return query;
            },
            order() {
              return query;
            },
            limit() {
              return query;
            },
            maybeSingle() {
              return Promise.resolve({
                data: Array.isArray(result.data)
                  ? (result.data[0] ?? null)
                  : null,
                error: null,
              });
            },
            then(resolve: (value: TableResult) => unknown) {
              return Promise.resolve(resolve(result));
            },
          };
          return query;
        },
      };
    },
  };
}

describe("skill.dao v2", () => {
  it("builds registry document from schema tables", async () => {
    resetSkillRegistryCacheForTests();
    const client = createMockClient({
      m_skill_implementation_kind: {
        data: [
          {
            implementation_kind: "primitive",
            display_name: "Primitive",
            description: "common",
            sort_order: 1,
            is_active: true,
          },
        ],
        error: null,
      },
      m_skill_schema_group: {
        data: [
          {
            schema_kind: "trigger",
            group_code: "event_move",
            group_name: "移動イベント",
            description: "",
            sort_order: 1,
            is_active: true,
          },
        ],
        error: null,
      },
      m_skill_schema_option: {
        data: [
          {
            schema_kind: "trigger",
            group_code: "event_move",
            option_code: "after_move",
            option_name: "移動後",
            description: "",
            value_type: null,
            sort_order: 1,
            is_script_only: false,
            is_active: true,
          },
        ],
        error: null,
      },
    });

    const registry = await listSkillRegistryWithClient(client as never);
    expect(registry.version).toBe("skill-registry-v2-db");
    expect(registry.implementationKinds[0]?.code).toBe("primitive");
    expect(registry.registries.trigger.groups[0]?.groupCode).toBe("event_move");
    expect(registry.registries.trigger.groups[0]?.options[0]?.optionCode).toBe(
      "after_move",
    );
  });

  it("lists v2 skills with trigger/implementation/effect counts", async () => {
    resetSkillRegistryCacheForTests();
    const client = createMockClient({
      m_skill_implementation_kind: {
        data: [
          {
            implementation_kind: "primitive",
            display_name: "Primitive",
            description: "common",
            sort_order: 1,
            is_active: true,
          },
        ],
        error: null,
      },
      m_skill_schema_group: {
        data: [
          {
            schema_kind: "trigger",
            group_code: "event_move",
            group_name: "移動イベント",
            description: "",
            sort_order: 1,
            is_active: true,
          },
          {
            schema_kind: "effect",
            group_code: "piece_position",
            group_name: "位置",
            description: "",
            sort_order: 1,
            is_active: true,
          },
          {
            schema_kind: "target",
            group_code: "adjacent",
            group_name: "隣接",
            description: "",
            sort_order: 1,
            is_active: true,
          },
        ],
        error: null,
      },
      m_skill_schema_option: {
        data: [
          {
            schema_kind: "trigger",
            group_code: "event_move",
            option_code: "after_move",
            option_name: "移動後",
            description: "",
            value_type: null,
            sort_order: 1,
            is_script_only: false,
            is_active: true,
          },
          {
            schema_kind: "effect",
            group_code: "piece_position",
            option_code: "forced_move",
            option_name: "強制移動",
            description: "",
            value_type: null,
            sort_order: 1,
            is_script_only: false,
            is_active: true,
          },
          {
            schema_kind: "target",
            group_code: "adjacent",
            option_code: "adjacent_enemy",
            option_name: "隣接敵",
            description: "",
            value_type: null,
            sort_order: 1,
            is_script_only: false,
            is_active: true,
          },
        ],
        error: null,
      },
      m_skill: {
        data: [
          {
            skill_id: 65,
            skill_code: "skill_65",
            skill_desc: "移動時に押し出す",
            implementation_kind: "primitive",
            trigger_group: "event_move",
            trigger_type: "after_move",
            source_kind: "manual",
            source_file: null,
            source_function: null,
            tags_json: ["move_trigger"],
            script_hook: null,
          },
        ],
        error: null,
      },
      m_skill_condition: {
        data: [
          {
            skill_condition_id: 1,
            skill_id: 65,
            condition_order: 1,
            condition_group: "probability",
            condition_type: "chance_roll",
            params_json: { procChance: 0.2 },
            is_active: true,
          },
        ],
        error: null,
      },
      m_skill_effect: {
        data: [
          {
            skill_effect_id: 1,
            skill_id: 65,
            effect_order: 1,
            effect_group: "piece_position",
            effect_type: "forced_move",
            target_group: "adjacent",
            target_selector: "adjacent_enemy",
            target_rule: "adjacent_enemy",
            trigger_timing: "after_move",
            proc_chance: 0.2,
            duration_turns: null,
            radius: 1,
            value_num: null,
            value_text: null,
            params_json: {},
            is_active: true,
          },
        ],
        error: null,
      },
    });

    const skills = await listSkillsWithClient(client as never);
    expect(skills).toHaveLength(1);
    expect(skills[0]?.version).toBe("v2");
    expect(skills[0]?.implementationKind).toBe("primitive");
    expect(skills[0]?.triggerType).toBe("after_move");
    expect(skills[0]?.effectCount).toBe(1);
    expect(skills[0]?.conditionCount).toBe(1);
  });
});
