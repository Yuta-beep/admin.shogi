import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("admin DAO DB schema contract", () => {
  it("piece/move DAO reference required move schema tables", () => {
    const pieceDao = readSource("src/api/dao/piece.dao.ts");
    const movePatternDao = readSource("src/api/dao/movePattern.dao.ts");

    expect(pieceDao).toContain('.from("m_piece")');
    expect(pieceDao).toContain("move_description_ja");
    expect(pieceDao).toContain("rarity");
    expect(pieceDao).toContain("m_move_pattern:move_pattern_id(move_name)");
    expect(pieceDao).toContain("m_skill:skill_id(skill_desc)");

    expect(movePatternDao).toContain('.from("m_move_pattern")');
    expect(movePatternDao).toContain('.from("m_move_pattern_vector")');
    expect(movePatternDao).toContain('.from("m_move_pattern_rule")');
    expect(movePatternDao).toContain("can_jump");
    expect(movePatternDao).toContain("constraints_json");
    expect(movePatternDao).toContain("params_json");
  });

  it("stage/skill DAO reference required master tables", () => {
    const stageDao = readSource("src/api/dao/stage.dao.ts");
    const skillDao = readSource("src/api/dao/skill.dao.ts");

    expect(stageDao).toContain('.from("m_stage")');
    expect(stageDao).toContain('.from("m_stage_initial_placement")');
    expect(stageDao).toContain('.from("m_piece")');

    expect(skillDao).toContain('.from("m_skill")');
    expect(skillDao).toContain('.from("m_skill_effect")');
    expect(skillDao).toContain("effect_type");
    expect(skillDao).toContain("trigger_timing");
  });
});
