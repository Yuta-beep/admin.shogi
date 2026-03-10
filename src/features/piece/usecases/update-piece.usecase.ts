import {
  getPieceById,
  updatePieceRecord,
} from "@/features/piece/api/dao/piece.dao";
import {
  deletePieceImage,
  uploadPieceImage,
} from "@/features/piece/api/dao/piece-image.dao";
import { PieceFormInput } from "@/features/piece/domain/piece.types";

type UpdatePieceDeps = {
  getPieceById: typeof getPieceById;
  updatePieceRecord: typeof updatePieceRecord;
  uploadPieceImage: typeof uploadPieceImage;
  deletePieceImage: typeof deletePieceImage;
};

const defaultDeps: UpdatePieceDeps = {
  getPieceById,
  updatePieceRecord,
  uploadPieceImage,
  deletePieceImage,
};

export function createUpdatePieceUseCase(deps: UpdatePieceDeps = defaultDeps) {
  return async function updatePieceUseCase(
    pieceId: number,
    input: PieceFormInput,
  ) {
    const existing = await deps.getPieceById(pieceId);
    if (!existing) {
      throw new Error(`Piece ${pieceId} not found`);
    }

    let imageOverride:
      | { imageBucket: string; imageKey: string; imageVersion: number }
      | undefined;

    if (input.imageFile) {
      const uploaded = await deps.uploadPieceImage({
        pieceCode: input.pieceCode,
        imageFile: input.imageFile,
      });

      imageOverride = {
        imageBucket: uploaded.imageBucket,
        imageKey: uploaded.imageKey,
        imageVersion: Math.max(1, existing.imageVersion + 1),
      };
    }

    const updated = await deps.updatePieceRecord(pieceId, input, imageOverride);
    if (!updated) {
      throw new Error("Failed to update piece");
    }

    if (imageOverride && existing.imageBucket && existing.imageKey) {
      try {
        await deps.deletePieceImage({
          imageBucket: existing.imageBucket,
          imageKey: existing.imageKey,
        });
      } catch {
        // Keep update success even if old asset cleanup fails.
      }
    }

    return updated;
  };
}

export const updatePieceUseCase = createUpdatePieceUseCase();
