import { describe, expect, it } from "bun:test";

import { parsePieceFormData } from "@/utils/piece-form-parser";

function createBaseFormData() {
  const formData = new FormData();
  formData.set("pieceCode", " P001 ");
  formData.set("kanji", "歩");
  formData.set("name", "歩兵");
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

  it("builds skillDraft when hasSkill=true", () => {
    const formData = createBaseFormData();
    formData.set("hasSkill", "true");
    formData.set("skillDesc", "敵を凍結");
    formData.set("skillEffectType", "freeze");
    formData.set("skillTargetRule", "front_enemy");
    formData.set("skillTriggerTiming", "on_attack");
    formData.set("skillValueText", "slow");
    formData.set("skillValueNum", "2");
    formData.set("skillProcChance", "0.5");
    formData.set("skillDurationTurns", "3");
    formData.set("skillRadius", "1");
    formData.set("skillParamsJson", '{"element":"ice"}');

    const parsed = parsePieceFormData(formData);

    expect(parsed.skillDraft).toEqual({
      skillDesc: "敵を凍結",
      effectType: "freeze",
      targetRule: "front_enemy",
      triggerTiming: "on_attack",
      valueText: "slow",
      valueNum: 2,
      procChance: 0.5,
      durationTurns: 3,
      radius: 1,
      paramsJson: { element: "ice" },
    });
  });

  it("throws when hasSkill=true and required skill field is missing", () => {
    const formData = createBaseFormData();
    formData.set("hasSkill", "true");
    formData.set("skillEffectType", "freeze");
    formData.set("skillTargetRule", "front_enemy");
    formData.set("skillTriggerTiming", "on_attack");
    formData.set("skillValueText", "slow");
    formData.set("skillValueNum", "2");
    formData.set("skillProcChance", "0.5");
    formData.set("skillDurationTurns", "3");
    formData.set("skillRadius", "1");

    expect(() => parsePieceFormData(formData)).toThrow(
      "skillDesc is required when creating skill",
    );
  });

  it("throws when moveVectorsJson has invalid shape", () => {
    const formData = createBaseFormData();
    formData.delete("movePatternId");
    formData.set(
      "moveVectorsJson",
      JSON.stringify([{ dx: 1, dy: 0, maxStep: 0 }]),
    );

    expect(() => parsePieceFormData(formData)).toThrow(
      "moveVectorsJson[0] maxStep must be a positive integer",
    );
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
