import {
  deletePieceRecord,
  getPieceById,
} from "@/features/piece/api/dao/piece.dao";
import { deletePieceImage } from "@/features/piece/api/dao/piece-image.dao";

type DeletePieceDeps = {
  getPieceById: typeof getPieceById;
  deletePieceRecord: typeof deletePieceRecord;
  deletePieceImage: typeof deletePieceImage;
};

const defaultDeps: DeletePieceDeps = {
  getPieceById,
  deletePieceRecord,
  deletePieceImage,
};

export function createDeletePieceUseCase(deps: DeletePieceDeps = defaultDeps) {
  return async function deletePieceUseCase(pieceId: number) {
    const existing = await deps.getPieceById(pieceId);
    if (!existing) {
      throw new Error(`Piece ${pieceId} not found`);
    }

    await deps.deletePieceRecord(pieceId);

    if (existing.imageBucket && existing.imageKey) {
      try {
        await deps.deletePieceImage({
          imageBucket: existing.imageBucket,
          imageKey: existing.imageKey,
        });
      } catch {
        // Piece row has been removed. Ignore storage cleanup error.
      }
    }

    return { deleted: true };
  };
}

export const deletePieceUseCase = createDeletePieceUseCase();
