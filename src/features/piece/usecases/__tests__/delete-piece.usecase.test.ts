import { describe, expect, it } from "bun:test";
import { createDeletePieceUseCase } from "@/features/piece/usecases/delete-piece.usecase";

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
  imageVersion: 1,
  isActive: true,
  publishedAt: null,
  unpublishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("deletePieceUseCase", () => {
  it("throws not found when target piece does not exist", async () => {
    const usecase = createDeletePieceUseCase({
      getPieceById: async () => null,
      deletePieceRecord: async () => undefined,
      deletePieceImage: async () => undefined,
    });

    await expect(usecase(9)).rejects.toThrow("Piece 9 not found");
  });

  it("deletes piece record and tries to cleanup image", async () => {
    let deleteRecordCalled = false;
    let deleteImageCalled = false;

    const usecase = createDeletePieceUseCase({
      getPieceById: async () => existingPiece,
      deletePieceRecord: async () => {
        deleteRecordCalled = true;
      },
      deletePieceImage: async () => {
        deleteImageCalled = true;
      },
    });

    const result = await usecase(1);

    expect(result).toEqual({ deleted: true });
    expect(deleteRecordCalled).toBe(true);
    expect(deleteImageCalled).toBe(true);
  });

  it("keeps success when image cleanup fails", async () => {
    const usecase = createDeletePieceUseCase({
      getPieceById: async () => existingPiece,
      deletePieceRecord: async () => undefined,
      deletePieceImage: async () => {
        throw new Error("cleanup failed");
      },
    });

    await expect(usecase(1)).resolves.toEqual({ deleted: true });
  });
});
