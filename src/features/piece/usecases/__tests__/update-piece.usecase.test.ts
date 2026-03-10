import { describe, expect, it } from "bun:test";
import { createUpdatePieceUseCase } from "@/features/piece/usecases/update-piece.usecase";

const baseInput = {
  pieceCode: "FU",
  kanji: "歩",
  name: "歩兵",
  movePatternId: 1,
  skillId: null,
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
  skillName: null,
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
      updatePieceRecord: async () => existingPiece,
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      deletePieceImage: async () => undefined,
    });

    await expect(usecase(999, baseInput)).rejects.toThrow(
      "Piece 999 not found",
    );
  });

  it("updates without image override when imageFile is null", async () => {
    let updateArgs: unknown[] = [];

    const usecase = createUpdatePieceUseCase({
      getPieceById: async () => existingPiece,
      updatePieceRecord: async (...args) => {
        updateArgs = args;
        return existingPiece;
      },
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      deletePieceImage: async () => undefined,
    });

    await usecase(1, baseInput);

    expect(updateArgs[0]).toBe(1);
    expect(updateArgs[2]).toBeUndefined();
  });

  it("uploads new image and deletes old one (cleanup failure ignored)", async () => {
    let deletedCalled = false;
    let updateArgs: unknown[] = [];
    const file = new File(["new"], "new.png", { type: "image/png" });

    const usecase = createUpdatePieceUseCase({
      getPieceById: async () => existingPiece,
      uploadPieceImage: async () => ({
        imageBucket: "piece-images",
        imageKey: "pieces/new.png",
      }),
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
      updatePieceRecord: async () => null,
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      deletePieceImage: async () => undefined,
    });

    await expect(usecase(1, baseInput)).rejects.toThrow(
      "Failed to update piece",
    );
  });
});
