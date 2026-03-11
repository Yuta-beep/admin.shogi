import { describe, expect, it } from "bun:test";
import { parsePieceFormData } from "@/features/piece/utils/piece-form-parser";

function createBaseFormData() {
  const fd = new FormData();
  fd.set("kanji", " 歩 ");
  fd.set("name", " 歩兵 ");
  fd.set("movePatternId", "1");
  fd.set("skillId", "");
  fd.set("imageVersion", "2");
  fd.set("isActive", "true");
  fd.set("publishedAt", "2026-03-10T10:00");
  fd.set("unpublishedAt", "");
  return fd;
}

describe("parsePieceFormData", () => {
  it("parses required fields and normalizes values", () => {
    const fd = createBaseFormData();
    const image = new File(["image"], "piece.png", { type: "image/png" });
    fd.set("image", image);

    const result = parsePieceFormData(fd);

    expect(result.pieceCode).toBe("");
    expect(result.kanji).toBe("歩");
    expect(result.name).toBe("歩兵");
    expect(result.movePatternId).toBe(1);
    expect(result.moveVectors).toEqual([]);
    expect(result.skillId).toBeNull();
    expect(result.skillDraft).toBeNull();
    expect(result.imageSource).toBe("supabase");
    expect(result.imageVersion).toBe(2);
    expect(result.isActive).toBe(true);
    expect(result.publishedAt).toContain("2026-03-10");
    expect(result.unpublishedAt).toBeNull();
    expect(result.imageFile?.name).toBe("piece.png");
  });

  it("always uses supabase and defaults imageVersion to 1", () => {
    const fd = createBaseFormData();
    fd.delete("imageVersion");

    const result = parsePieceFormData(fd);

    expect(result.imageSource).toBe("supabase");
    expect(result.imageVersion).toBe(1);
  });

  it("throws when required fields are missing", () => {
    const fd = new FormData();

    expect(() => parsePieceFormData(fd)).toThrow("kanji is required");
  });

  it("throws when integer fields are invalid", () => {
    const fd = createBaseFormData();
    fd.set("movePatternId", "abc");

    expect(() => parsePieceFormData(fd)).toThrow(
      "movePatternId must be an integer",
    );
  });

  it("parses move vectors json and allows empty movePatternId", () => {
    const fd = createBaseFormData();
    fd.set("movePatternId", "");
    fd.set("moveVectorsJson", '[{"dx":0,"dy":-1,"maxStep":1}]');

    const result = parsePieceFormData(fd);
    expect(result.movePatternId).toBeNull();
    expect(result.moveVectors).toEqual([{ dx: 0, dy: -1, maxStep: 1 }]);
  });

  it("parses skill draft fields when provided", () => {
    const fd = createBaseFormData();
    fd.set("hasSkill", "true");
    fd.set("skillDesc", "周囲を押し出す");
    fd.set("skillEffectType", "forced_move");
    fd.set("skillTargetRule", "adjacent_area");
    fd.set("skillTriggerTiming", "passive");
    fd.set("skillValueText", "押し出す");
    fd.set("skillValueNum", "1");
    fd.set("skillProcChance", "0.5");
    fd.set("skillDurationTurns", "2");
    fd.set("skillRadius", "1");
    fd.set("skillParamsJson", '{"power":1}');

    const result = parsePieceFormData(fd);

    expect(result.skillDraft).toEqual({
      skillDesc: "周囲を押し出す",
      effectType: "forced_move",
      targetRule: "adjacent_area",
      triggerTiming: "passive",
      valueText: "押し出す",
      valueNum: 1,
      procChance: 0.5,
      durationTurns: 2,
      radius: 1,
      paramsJson: { power: 1 },
    });
  });

  it("throws when skill params json is invalid", () => {
    const fd = createBaseFormData();
    fd.set("hasSkill", "true");
    fd.set("skillDesc", "回復");
    fd.set("skillEffectType", "heal");
    fd.set("skillTargetRule", "self");
    fd.set("skillTriggerTiming", "passive");
    fd.set("skillValueText", "回復");
    fd.set("skillValueNum", "10");
    fd.set("skillProcChance", "0.2");
    fd.set("skillDurationTurns", "3");
    fd.set("skillRadius", "1");
    fd.set("skillParamsJson", "{bad json}");

    expect(() => parsePieceFormData(fd)).toThrow(
      "skillParamsJson must be valid JSON",
    );
  });
});
