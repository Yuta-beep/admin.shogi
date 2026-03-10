import { describe, expect, it } from "bun:test";
import {
  findMatchingMovePattern,
  vectorsFromBoardSelection,
} from "@/features/piece/utils/move-pattern-matcher";

describe("move-pattern-matcher", () => {
  it("builds non-repeatable vectors from selected cells", () => {
    const vectors = vectorsFromBoardSelection(
      [
        { row: 2, col: 3 }, // dx=-1,dy=-2
        { row: 2, col: 5 }, // dx=1,dy=-2
      ],
      false,
    );

    expect(vectors).toEqual([
      { dx: -1, dy: -2, maxStep: 1 },
      { dx: 1, dy: -2, maxStep: 1 },
    ]);
  });

  it("normalizes repeatable vectors to unit directions", () => {
    const vectors = vectorsFromBoardSelection(
      [
        { row: 3, col: 4 }, // up 1
        { row: 1, col: 4 }, // up 3 (same direction)
        { row: 5, col: 5 }, // down-right 1
      ],
      true,
    );

    expect(vectors).toEqual([
      { dx: 0, dy: -1, maxStep: 8 },
      { dx: 1, dy: 1, maxStep: 8 },
    ]);
  });

  it("finds matching move pattern by vector signature", () => {
    const matched = findMatchingMovePattern(
      [
        {
          id: 1,
          moveCode: "knight",
          moveName: "桂",
          vectors: [
            { dx: -1, dy: -2, maxStep: 1 },
            { dx: 1, dy: -2, maxStep: 1 },
          ],
        },
      ],
      [
        { dx: 1, dy: -2, maxStep: 1 },
        { dx: -1, dy: -2, maxStep: 1 },
      ],
    );

    expect(matched?.id).toBe(1);
  });
});
