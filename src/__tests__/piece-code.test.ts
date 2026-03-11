import { describe, expect, it } from "bun:test";

import { generatePieceCode, normalizePieceCode } from "@/utils/piece-code";

describe("normalizePieceCode", () => {
  it("returns null for null/empty", () => {
    expect(normalizePieceCode(null)).toBeNull();
    expect(normalizePieceCode("   ")).toBeNull();
  });

  it("trims, sanitizes, and uppercases", () => {
    expect(normalizePieceCode(" p-01_あ! ")).toBe("P-01_");
  });
});

describe("generatePieceCode", () => {
  it("generates uppercase sanitized code with P prefix", () => {
    const code = generatePieceCode();

    expect(code.startsWith("P")).toBe(true);
    expect(code).toMatch(/^[A-Z0-9_-]+$/);
    expect(code.length).toBeGreaterThan(4);
  });
});
