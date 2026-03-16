import { describe, expect, it } from "bun:test";

import { parsePieceFormData } from "@/utils/piece-form-parser";

function createBaseFormData() {
  const formData = new FormData();
  formData.set("pieceCode", " P001 ");
  formData.set("kanji", "歩");
  formData.set("name", "歩兵");
  formData.set("rarity", "N");
  formData.set("moveDescriptionJa", "1マス前進");
  formData.set("movePatternId", "1");
  formData.set("moveCanJump", "true");
  formData.set("imageVersion", "3");
  formData.set("isActive", "on");
  formData.set("publishedAt", "2026-03-11");
  formData.set("unpublishedAt", "");
  return formData;
}

describe("parsePieceFormData", () => {
  it("parses minimum valid payload with movePatternId", () => {
    const formData = createBaseFormData();

    const parsed = parsePieceFormData(formData);

    expect(parsed.pieceCode).toBe("P001");
    expect(parsed.kanji).toBe("歩");
    expect(parsed.name).toBe("歩兵");
    expect(parsed.rarity).toBe("N");
    expect(parsed.moveDescriptionJa).toBe("1マス前進");
    expect(parsed.movePatternId).toBe(1);
    expect(parsed.moveVectors).toEqual([]);
    expect(parsed.moveCanJump).toBe(true);
    expect(parsed.moveRulesJson).toBeNull();
    expect(parsed.skillId).toBeNull();
    expect(parsed.skillDraft).toBeNull();
    expect(parsed.imageSource).toBe("supabase");
    expect(parsed.imageVersion).toBe(3);
    expect(parsed.isActive).toBe(true);
    expect(parsed.publishedAt).toBe("2026-03-11T00:00:00.000Z");
    expect(parsed.unpublishedAt).toBeNull();
    expect(parsed.imageFile).toBeNull();
  });

  it("accepts moveVectorsJson when movePatternId is absent", () => {
    const formData = createBaseFormData();
    formData.delete("movePatternId");
    formData.set(
      "moveVectorsJson",
      JSON.stringify([
        { dx: 1, dy: 0, maxStep: 1 },
        { dx: 0, dy: -1, maxStep: 8 },
      ]),
    );

    const parsed = parsePieceFormData(formData);

    expect(parsed.movePatternId).toBeNull();
    expect(parsed.moveVectors).toEqual([
      { dx: 1, dy: 0, maxStep: 1 },
      { dx: 0, dy: -1, maxStep: 8 },
    ]);
  });

  it("throws when both movePatternId and moveVectorsJson are missing", () => {
    const formData = createBaseFormData();
    formData.delete("movePatternId");

    expect(() => parsePieceFormData(formData)).toThrow(
      "movePatternId or moveVectorsJson is required",
    );
  });

  it("parses specialMoveType=turn_parity_moon", () => {
    const formData = createBaseFormData();
    formData.set("specialMoveType", "turn_parity_moon");

    const parsed = parsePieceFormData(formData);

    expect(parsed.moveRulesJson).toEqual([
      {
        ruleType: "turn_parity_override",
        priority: 10,
        paramsJson: {
          odd: { type: "step_limit", max_step: 1, rays: "queen" },
          even: { type: "step_limit", min_step: 2, max_step: 2, rays: "queen" },
          source: "admin_form",
        },
      },
    ]);
  });

  it("throws when specialMoveType is invalid", () => {
    const formData = createBaseFormData();
    formData.set("specialMoveType", "unknown");

    expect(() => parsePieceFormData(formData)).toThrow(
      "specialMoveType is invalid",
    );
  });

  it("uses selected skillId when hasSkill=true and skillMode=existing", () => {
    const formData = createBaseFormData();
    formData.set("hasSkill", "true");
    formData.set("skillMode", "existing");
    formData.set("skillId", "65");

    const parsed = parsePieceFormData(formData);

    expect(parsed.skillId).toBe(65);
    expect(parsed.skillDraft).toBeNull();
  });

  it("builds v2 skillDraft when hasSkill=true and skillMode=draft", () => {
    const formData = createBaseFormData();
    formData.set("hasSkill", "true");
    formData.set("skillMode", "draft");
    formData.set("skillDesc", "移動時に周囲の敵駒を押し出す");
    formData.set("implementationKind", "primitive");
    formData.set("skillTriggerGroup", "event_move");
    formData.set("skillTriggerType", "after_move");
    formData.set("scriptHook", "");
    formData.set("skillTagsCsv", "move_trigger,adjacent");
    formData.set(
      "skillConditionsJson",
      JSON.stringify([
        {
          clientKey: "c1",
          group: "probability",
          type: "chance_roll",
          paramsJson: '{"procChance":0.2}',
        },
      ]),
    );
    formData.set(
      "skillEffectsJson",
      JSON.stringify([
        {
          clientKey: "e1",
          group: "piece_position",
          type: "forced_move",
          targetGroup: "adjacent",
          targetSelector: "adjacent_enemy",
          paramsJson: '{"movementRule":"push_away","radius":1}',
        },
      ]),
    );

    const parsed = parsePieceFormData(formData);

    expect(parsed.skillId).toBeNull();
    expect(parsed.skillDraft).toEqual({
      skillDesc: "移動時に周囲の敵駒を押し出す",
      implementationKind: "primitive",
      trigger: {
        group: "event_move",
        type: "after_move",
      },
      conditions: [
        {
          order: 1,
          group: "probability",
          type: "chance_roll",
          paramsJson: { procChance: 0.2 },
        },
      ],
      effects: [
        {
          order: 1,
          group: "piece_position",
          type: "forced_move",
          target: {
            group: "adjacent",
            selector: "adjacent_enemy",
          },
          paramsJson: {
            movementRule: "push_away",
            radius: 1,
          },
        },
      ],
      scriptHook: null,
      tags: ["move_trigger", "adjacent"],
      sourceKind: "manual",
      sourceFile: null,
      sourceFunction: null,
    });
  });

  it("allows script_hook skill without effects", () => {
    const formData = createBaseFormData();
    formData.set("hasSkill", "true");
    formData.set("skillMode", "draft");
    formData.set("skillDesc", "専用フック");
    formData.set("implementationKind", "script_hook");
    formData.set("skillTriggerGroup", "special");
    formData.set("skillTriggerType", "script_hook");
    formData.set("scriptHook", "reflect_until_blocked");
    formData.set("skillConditionsJson", "[]");
    formData.set("skillEffectsJson", "[]");

    const parsed = parsePieceFormData(formData);

    expect(parsed.skillDraft?.implementationKind).toBe("script_hook");
    expect(parsed.skillDraft?.effects).toEqual([]);
    expect(parsed.skillDraft?.scriptHook).toBe("reflect_until_blocked");
  });

  it("throws when script_hook has empty scriptHook", () => {
    const formData = createBaseFormData();
    formData.set("hasSkill", "true");
    formData.set("skillMode", "draft");
    formData.set("skillDesc", "専用フック");
    formData.set("implementationKind", "script_hook");
    formData.set("skillTriggerGroup", "special");
    formData.set("skillTriggerType", "script_hook");
    formData.set("skillConditionsJson", "[]");
    formData.set("skillEffectsJson", "[]");

    expect(() => parsePieceFormData(formData)).toThrow(
      "scriptHook is required for script_hook skill",
    );
  });

  it("throws when rarity is invalid", () => {
    const formData = createBaseFormData();
    formData.set("rarity", "LEGEND");

    expect(() => parsePieceFormData(formData)).toThrow("rarity is invalid");
  });

  it("parses non-empty image file", () => {
    const formData = createBaseFormData();
    const file = new File(["binary"], "piece.png", { type: "image/png" });
    formData.set("image", file);

    const parsed = parsePieceFormData(formData);

    expect(parsed.imageFile).not.toBeNull();
    expect(parsed.imageFile?.name).toBe("piece.png");
    expect(parsed.imageFile?.type).toBe("image/png");
    expect(parsed.imageFile?.size).toBe(6);
  });
});
