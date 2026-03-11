import { describe, expect, it } from "bun:test";

import {
  findMatchingMovePattern,
  vectorsFromBoardSelection,
} from "@/utils/move-pattern-matcher";

const options = [
  {
    id: 1,
    moveCode: "rook",
    moveName: "飛車",
    vectors: [
      { dx: 1, dy: 0, maxStep: 8 },
      { dx: -1, dy: 0, maxStep: 8 },
      { dx: 0, dy: 1, maxStep: 8 },
      { dx: 0, dy: -1, maxStep: 8 },
    ],
  },
  {
    id: 2,
    moveCode: "king",
    moveName: "王",
    vectors: [
      { dx: 1, dy: 0, maxStep: 1 },
      { dx: -1, dy: 0, maxStep: 1 },
      { dx: 0, dy: 1, maxStep: 1 },
      { dx: 0, dy: -1, maxStep: 1 },
    ],
  },
];

describe("vectorsFromBoardSelection", () => {
  it("ignores board center and deduplicates vectors", () => {
    const vectors = vectorsFromBoardSelection(
      [
        { row: 4, col: 4 },
        { row: 4, col: 6 },
        { row: 4, col: 6 },
      ],
      false,
    );

    expect(vectors).toEqual([{ dx: 2, dy: 0, maxStep: 1 }]);
  });

  it("normalizes repeatable vectors with gcd", () => {
    const vectors = vectorsFromBoardSelection(
      [
        { row: 4, col: 6 },
        { row: 4, col: 5 },
      ],
      true,
    );

    expect(vectors).toEqual([{ dx: 1, dy: 0, maxStep: 8 }]);
  });
});

describe("findMatchingMovePattern", () => {
  it("matches by vector signature regardless of order", () => {
    const match = findMatchingMovePattern(options, [
      { dx: 0, dy: -1, maxStep: 8 },
      { dx: -1, dy: 0, maxStep: 8 },
      { dx: 1, dy: 0, maxStep: 8 },
      { dx: 0, dy: 1, maxStep: 8 },
    ]);

    expect(match?.id).toBe(1);
  });

  it("returns null when vectors are empty or unmatched", () => {
    expect(findMatchingMovePattern(options, [])).toBeNull();
    expect(
      findMatchingMovePattern(options, [{ dx: 1, dy: 1, maxStep: 8 }]),
    ).toBeNull();
  });
});
