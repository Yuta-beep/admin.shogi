import { describe, expect, it } from "bun:test";
import { createCreatePieceUseCase } from "@/features/piece/usecases/create-piece.usecase";

const baseInput = {
  pieceCode: "FU",
  kanji: "歩",
  name: "歩兵",
  movePatternId: 1,
  skillId: null,
  imageSource: "s3" as const,
  imageVersion: 1,
  isActive: true,
  publishedAt: null,
  unpublishedAt: null,
  imageFile: null as File | null,
};

describe("createPieceUseCase", () => {
  it("creates piece without image upload when imageFile is null", async () => {
    let uploadCalled = false;
    let insertArgs: unknown[] = [];

    const usecase = createCreatePieceUseCase({
      uploadPieceImage: async () => {
        uploadCalled = true;
        return { imageBucket: "bucket", imageKey: "key" };
      },
      insertPiece: async (...args) => {
        insertArgs = args;
        return { pieceId: 1 } as { pieceId: number };
      },
    });

    const result = await usecase(baseInput);

    expect(result).toEqual({ pieceId: 1 });
    expect(uploadCalled).toBe(false);
    expect(insertArgs[0]).toMatchObject({ imageSource: "s3", imageVersion: 1 });
    expect(insertArgs[1]).toBeUndefined();
  });

  it("uploads image and forces supabase source when imageFile exists", async () => {
    let uploaded = false;
    let insertArgs: unknown[] = [];
    const file = new File(["x"], "piece.png", { type: "image/png" });

    const usecase = createCreatePieceUseCase({
      uploadPieceImage: async () => {
        uploaded = true;
        return { imageBucket: "piece-images", imageKey: "pieces/FU-1.png" };
      },
      insertPiece: async (...args) => {
        insertArgs = args;
        return { pieceId: 2 } as { pieceId: number };
      },
    });

    await usecase({
      ...baseInput,
      imageFile: file,
      imageSource: "s3",
      imageVersion: 0,
    });

    expect(uploaded).toBe(true);
    expect(insertArgs[0]).toMatchObject({
      imageSource: "supabase",
      imageVersion: 1,
    });
    expect(insertArgs[1]).toEqual({
      imageBucket: "piece-images",
      imageKey: "pieces/FU-1.png",
    });
  });

  it("throws when insert result is empty", async () => {
    const usecase = createCreatePieceUseCase({
      uploadPieceImage: async () => ({ imageBucket: "b", imageKey: "k" }),
      insertPiece: async () => null,
    });

    await expect(usecase(baseInput)).rejects.toThrow("Failed to create piece");
  });
});
