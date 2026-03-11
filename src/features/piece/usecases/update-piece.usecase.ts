import {
  getPieceById,
  insertMovePatternWithVectors,
  updatePieceRecord,
} from "@/features/piece/api/dao/piece.dao";
import {
  deletePieceImage,
  uploadPieceImage,
} from "@/features/piece/api/dao/piece-image.dao";
import { insertSkillWithEffect } from "@/features/piece/api/dao/skill.dao";
import { PieceFormInput } from "@/features/piece/domain/piece.types";
import { normalizePieceCode } from "@/features/piece/utils/piece-code";

type UpdatePieceDeps = {
  getPieceById: typeof getPieceById;
  insertMovePatternWithVectors: typeof insertMovePatternWithVectors;
  updatePieceRecord: typeof updatePieceRecord;
  uploadPieceImage: typeof uploadPieceImage;
  deletePieceImage: typeof deletePieceImage;
  insertSkillWithEffect: typeof insertSkillWithEffect;
};

const defaultDeps: UpdatePieceDeps = {
  getPieceById,
  insertMovePatternWithVectors,
  updatePieceRecord,
  uploadPieceImage,
  deletePieceImage,
  insertSkillWithEffect,
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
    const pieceCode = normalizePieceCode(input.pieceCode) ?? existing.pieceCode;
    const resolvedSkillId = input.skillDraft
      ? await deps.insertSkillWithEffect(input.skillDraft)
      : input.skillId;
    const resolvedMovePatternId =
      input.moveVectors.length > 0
        ? await deps.insertMovePatternWithVectors(input.moveVectors, {
            kanji: input.kanji,
            name: input.name,
          })
        : (input.movePatternId ?? existing.movePatternId);

    let imageOverride:
      | { imageBucket: string; imageKey: string; imageVersion: number }
      | undefined;

    if (input.imageFile) {
      const uploaded = await deps.uploadPieceImage({
        pieceCode,
        imageFile: input.imageFile,
      });

      imageOverride = {
        imageBucket: uploaded.imageBucket,
        imageKey: uploaded.imageKey,
        imageVersion: Math.max(1, existing.imageVersion + 1),
      };
    }

    const updated = await deps.updatePieceRecord(
      pieceId,
      {
        ...input,
        pieceCode,
        movePatternId: resolvedMovePatternId,
        moveVectors: [],
        skillId: resolvedSkillId,
        skillDraft: null,
      },
      imageOverride,
    );
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
