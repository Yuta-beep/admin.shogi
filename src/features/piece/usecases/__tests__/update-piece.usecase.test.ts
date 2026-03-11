import { describe, expect, it } from "bun:test";
import { createUpdatePieceUseCase } from "@/features/piece/usecases/update-piece.usecase";

const baseInput = {
  pieceCode: "",
  kanji: "歩",
  name: "歩兵",
  movePatternId: 1,
  moveVectors: [],
  skillId: null,
  skillDraft: null,
  imageSource: "supabase" as const,
  imageVersion: 3,
  isActive: true,
  publishedAt: null,
  unpublishedAt: null,
  imageFile: null as File | null,
};

const existingPiece = {
  pieceId: 1,
  pieceCode: "FU",
  kanji: "歩",
  name: "歩兵",
  movePatternId: 1,
  movePatternName: "pawn",
  skillId: null,
  skillDesc: null,
  imageSource: "supabase",
  imageBucket: "piece-images",
  imageKey: "pieces/old.png",
  imageVersion: 3,
  isActive: true,
  publishedAt: null,
  unpublishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("updatePieceUseCase", () => {
  it("throws not found when target piece does not exist", async () => {
    const usecase = createUpdatePieceUseCase({
      getPieceById: async () => null,
      insertMovePatternWithVectors: async () => 88,
      updatePieceRecord: async () => existingPiece,
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      deletePieceImage: async () => undefined,
      insertSkillWithEffect: async () => 100,
    });

    await expect(usecase(999, baseInput)).rejects.toThrow(
      "Piece 999 not found",
    );
  });

  it("updates without image override when imageFile is null", async () => {
    let updateArgs: unknown[] = [];

    const usecase = createUpdatePieceUseCase({
      getPieceById: async () => existingPiece,
      insertMovePatternWithVectors: async () => 88,
      updatePieceRecord: async (...args) => {
        updateArgs = args;
        return existingPiece;
      },
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      deletePieceImage: async () => undefined,
      insertSkillWithEffect: async () => 100,
    });

    await usecase(1, baseInput);

    expect(updateArgs[0]).toBe(1);
    expect(updateArgs[1]).toMatchObject({ pieceCode: "FU" });
    expect(updateArgs[2]).toBeUndefined();
  });

  it("uploads new image and deletes old one (cleanup failure ignored)", async () => {
    let deletedCalled = false;
    let updateArgs: unknown[] = [];
    const file = new File(["new"], "new.png", { type: "image/png" });

    const usecase = createUpdatePieceUseCase({
      getPieceById: async () => existingPiece,
      insertMovePatternWithVectors: async () => 88,
      uploadPieceImage: async (input) => {
        expect(input.pieceCode).toBe("FU");
        return {
          imageBucket: "piece-images",
          imageKey: "pieces/new.png",
        };
      },
      updatePieceRecord: async (...args) => {
        updateArgs = args;
        return {
          ...existingPiece,
          imageKey: "pieces/new.png",
          imageVersion: 4,
        };
      },
      deletePieceImage: async () => {
        deletedCalled = true;
        throw new Error("cleanup failed");
      },
      insertSkillWithEffect: async () => 100,
    });

    const result = await usecase(1, { ...baseInput, imageFile: file });

    expect(result.imageKey).toBe("pieces/new.png");
    expect(updateArgs[2]).toEqual({
      imageBucket: "piece-images",
      imageKey: "pieces/new.png",
      imageVersion: 4,
    });
    expect(deletedCalled).toBe(true);
  });

  it("throws when update result is empty", async () => {
    const usecase = createUpdatePieceUseCase({
      getPieceById: async () => existingPiece,
      insertMovePatternWithVectors: async () => 88,
      updatePieceRecord: async () => null,
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      deletePieceImage: async () => undefined,
      insertSkillWithEffect: async () => 100,
    });

    await expect(usecase(1, baseInput)).rejects.toThrow(
      "Failed to update piece",
    );
  });

  it("creates new skill from draft and updates skill_id", async () => {
    let draftCalled = false;
    let updateArgs: unknown[] = [];

    const usecase = createUpdatePieceUseCase({
      getPieceById: async () => existingPiece,
      insertMovePatternWithVectors: async () => 88,
      updatePieceRecord: async (...args) => {
        updateArgs = args;
        return existingPiece;
      },
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      deletePieceImage: async () => undefined,
      insertSkillWithEffect: async (draft) => {
        draftCalled = true;
        expect(draft.effectType).toBe("heal");
        return 909;
      },
    });

    await usecase(1, {
      ...baseInput,
      skillDraft: {
        skillDesc: "回復",
        effectType: "heal",
        targetRule: "self",
        triggerTiming: "passive",
        valueText: "回復",
        valueNum: 10,
        procChance: null,
        durationTurns: null,
        radius: null,
        paramsJson: null,
      },
    });

    expect(draftCalled).toBe(true);
    expect(updateArgs[1]).toMatchObject({ skillId: 909, skillDraft: null });
  });

  it("creates custom move pattern when move vectors are provided", async () => {
    let createMovePatternCalled = false;
    let updateArgs: unknown[] = [];

    const usecase = createUpdatePieceUseCase({
      getPieceById: async () => existingPiece,
      insertMovePatternWithVectors: async (vectors) => {
        createMovePatternCalled = true;
        expect(vectors).toHaveLength(1);
        return 777;
      },
      updatePieceRecord: async (...args) => {
        updateArgs = args;
        return existingPiece;
      },
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      deletePieceImage: async () => undefined,
      insertSkillWithEffect: async () => 100,
    });

    await usecase(1, {
      ...baseInput,
      movePatternId: null,
      moveVectors: [{ dx: 1, dy: 0, maxStep: 8 }],
    });

    expect(createMovePatternCalled).toBe(true);
    expect(updateArgs[1]).toMatchObject({
      movePatternId: 777,
      moveVectors: [],
    });
  });
});
