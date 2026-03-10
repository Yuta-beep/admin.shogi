import { insertPiece } from "@/features/piece/api/dao/piece.dao";
import { uploadPieceImage } from "@/features/piece/api/dao/piece-image.dao";
import { PieceFormInput } from "@/features/piece/domain/piece.types";

type CreatePieceDeps = {
  insertPiece: typeof insertPiece;
  uploadPieceImage: typeof uploadPieceImage;
};

const defaultDeps: CreatePieceDeps = {
  insertPiece,
  uploadPieceImage,
};

export function createCreatePieceUseCase(deps: CreatePieceDeps = defaultDeps) {
  return async function createPieceUseCase(input: PieceFormInput) {
    const image = input.imageFile
      ? await deps.uploadPieceImage({
          pieceCode: input.pieceCode,
          imageFile: input.imageFile,
        })
      : null;

    const created = await deps.insertPiece(
      {
        ...input,
        imageSource: image ? "supabase" : input.imageSource,
        imageVersion: image
          ? Math.max(1, input.imageVersion)
          : input.imageVersion,
      },
      image
        ? { imageBucket: image.imageBucket, imageKey: image.imageKey }
        : undefined,
    );

    if (!created) {
      throw new Error("Failed to create piece");
    }

    return created;
  };
}

export const createPieceUseCase = createCreatePieceUseCase();
