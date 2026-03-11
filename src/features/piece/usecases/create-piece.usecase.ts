import {
  insertMovePatternWithVectors,
  insertPiece,
} from "@/features/piece/api/dao/piece.dao";
import { uploadPieceImage } from "@/features/piece/api/dao/piece-image.dao";
import { insertSkillWithEffect } from "@/features/piece/api/dao/skill.dao";
import { PieceFormInput } from "@/features/piece/domain/piece.types";
import {
  generatePieceCode,
  normalizePieceCode,
} from "@/features/piece/utils/piece-code";

type CreatePieceDeps = {
  insertPiece: typeof insertPiece;
  insertMovePatternWithVectors: typeof insertMovePatternWithVectors;
  uploadPieceImage: typeof uploadPieceImage;
  insertSkillWithEffect: typeof insertSkillWithEffect;
  generatePieceCode: typeof generatePieceCode;
};

const defaultDeps: CreatePieceDeps = {
  insertPiece,
  insertMovePatternWithVectors,
  uploadPieceImage,
  insertSkillWithEffect,
  generatePieceCode,
};

export function createCreatePieceUseCase(deps: CreatePieceDeps = defaultDeps) {
  return async function createPieceUseCase(input: PieceFormInput) {
    const pieceCode =
      normalizePieceCode(input.pieceCode) ?? deps.generatePieceCode();
    const resolvedSkillId = input.skillDraft
      ? await deps.insertSkillWithEffect(input.skillDraft)
      : input.skillId;
    const resolvedMovePatternId =
      input.moveVectors.length > 0
        ? await deps.insertMovePatternWithVectors(input.moveVectors, {
            kanji: input.kanji,
            name: input.name,
          })
        : input.movePatternId;
    if (!resolvedMovePatternId) {
      throw new Error("move pattern is required");
    }

    const image = input.imageFile
      ? await deps.uploadPieceImage({
          pieceCode,
          imageFile: input.imageFile,
        })
      : null;

    const created = await deps.insertPiece(
      {
        ...input,
        pieceCode,
        movePatternId: resolvedMovePatternId,
        moveVectors: [],
        skillId: resolvedSkillId,
        skillDraft: null,
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
