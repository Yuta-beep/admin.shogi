import {
  MovePatternOption,
  PieceRecord,
  SkillDraftOptions,
  SkillEffectRecord,
  SkillOption,
} from "@/api/model/piece";
import {
  deletePiece,
  getPieceById,
  insertPiece,
  listPieces,
  updatePiece,
} from "@/api/dao/piece.dao";
import {
  createSignedImageUrl,
  deletePieceImage,
  uploadPieceImage,
} from "@/api/dao/pieceImage.dao";
import {
  insertSkillWithEffect,
  listSkillDraftOptions,
  listSkillEffectsBySkillId,
  listSkills,
} from "@/api/dao/skill.dao";
import {
  getMovePatternDetailById,
  insertMovePatternWithVectors,
  listMovePatterns,
  listMoveVectorsByMovePatternId,
  updateMovePatternSpecialConfig,
} from "@/api/dao/movePattern.dao";
import { PieceFormInput } from "@/types/piece";
import { generatePieceCode, normalizePieceCode } from "@/utils/piece-code";

// レスポンス型
export type PieceListResponse = {
  pieces: PieceRecord[];
  movePatterns: MovePatternOption[];
  skills: SkillOption[];
  skillDraftOptions: SkillDraftOptions;
};

export type PieceDetailResponse = {
  piece: PieceRecord;
  skillEffects: SkillEffectRecord[];
  moveVectors: { dx: number; dy: number; maxStep: number }[];
  movePattern: {
    id: number;
    moveCode: string;
    moveName: string;
    isRepeatable: boolean;
    canJump: boolean;
    constraintsJson: Record<string, unknown> | null;
    rules: {
      ruleType: string;
      priority: number;
      paramsJson: Record<string, unknown> | null;
    }[];
  } | null;
  imageUrl: string | null;
};

// 駒一覧取得（検索対応）
export async function listPiecesUseCase(
  query?: string,
): Promise<PieceListResponse> {
  const [pieces, movePatterns, skills, skillDraftOptions] = await Promise.all([
    listPieces(),
    listMovePatterns(),
    listSkills(),
    listSkillDraftOptions(),
  ]);

  const filteredPieces = query
    ? (() => {
        const keyword = query.trim().toLowerCase();
        return keyword
          ? pieces.filter((piece) => {
              const kanji = piece.kanji.toLowerCase();
              const skillDesc = (piece.skillDesc ?? "").toLowerCase();
              return kanji.includes(keyword) || skillDesc.includes(keyword);
            })
          : pieces;
      })()
    : pieces;

  return { pieces: filteredPieces, movePatterns, skills, skillDraftOptions };
}

// 駒詳細取得
export async function getPieceDetailUseCase(
  pieceId: number,
): Promise<PieceDetailResponse | null> {
  const piece = await getPieceById(pieceId);
  if (!piece) return null;

  const [skillEffects, moveVectors, movePattern, imageUrl] = await Promise.all([
    piece.skillId
      ? listSkillEffectsBySkillId(piece.skillId)
      : Promise.resolve([]),
    listMoveVectorsByMovePatternId(piece.movePatternId),
    getMovePatternDetailById(piece.movePatternId),
    piece.imageBucket && piece.imageKey
      ? createSignedImageUrl(piece.imageBucket, piece.imageKey)
      : Promise.resolve(null),
  ]);

  return { piece, skillEffects, moveVectors, movePattern, imageUrl };
}

// 駒作成
export async function createPieceUseCase(
  input: PieceFormInput,
): Promise<PieceRecord> {
  const pieceCode = normalizePieceCode(input.pieceCode) ?? generatePieceCode();

  const skillId = input.skillDraft
    ? await insertSkillWithEffect(input.skillDraft)
    : input.skillId;

  const movePatternId =
    input.moveVectors.length > 0
      ? await insertMovePatternWithVectors(
          input.moveVectors,
          {
            kanji: input.kanji,
            name: input.name,
          },
          {
            canJump: input.moveCanJump ?? false,
            constraintsJson: input.moveConstraintsJson,
            rules: input.moveRulesJson ?? undefined,
          },
        )
      : input.movePatternId;

  if (!movePatternId) throw new Error("move pattern is required");

  if (
    input.moveVectors.length === 0 &&
    input.movePatternId &&
    (input.moveCanJump !== null ||
      input.moveConstraintsJson !== null ||
      input.moveRulesJson !== null)
  ) {
    await updateMovePatternSpecialConfig(input.movePatternId, {
      canJump: input.moveCanJump,
      constraintsJson: input.moveConstraintsJson,
      rules: input.moveRulesJson,
    });
  }

  const image = input.imageFile
    ? await uploadPieceImage({ pieceCode, imageFile: input.imageFile })
    : null;

  const created = await insertPiece({
    pieceCode,
    kanji: input.kanji,
    name: input.name,
    rarity: input.rarity,
    moveDescriptionJa: input.moveDescriptionJa,
    movePatternId,
    skillId,
    imageSource: image ? "supabase" : input.imageSource,
    imageBucket: image?.imageBucket ?? null,
    imageKey: image?.imageKey ?? null,
    imageVersion: image ? Math.max(1, input.imageVersion) : input.imageVersion,
    isActive: input.isActive,
    publishedAt: input.publishedAt,
    unpublishedAt: input.unpublishedAt,
  });

  if (!created) throw new Error("Failed to create piece");
  return created;
}

// 駒更新
export async function updatePieceUseCase(
  pieceId: number,
  input: PieceFormInput,
): Promise<PieceRecord> {
  const existing = await getPieceById(pieceId);
  if (!existing) throw new Error(`Piece ${pieceId} not found`);

  const pieceCode = normalizePieceCode(input.pieceCode) ?? existing.pieceCode;

  const skillId = input.skillDraft
    ? await insertSkillWithEffect(input.skillDraft)
    : input.skillId;

  const movePatternId =
    input.moveVectors.length > 0
      ? await insertMovePatternWithVectors(
          input.moveVectors,
          {
            kanji: input.kanji,
            name: input.name,
          },
          {
            canJump: input.moveCanJump ?? false,
            constraintsJson: input.moveConstraintsJson,
            rules: input.moveRulesJson ?? undefined,
          },
        )
      : (input.movePatternId ?? existing.movePatternId);

  if (
    input.moveVectors.length === 0 &&
    movePatternId &&
    (input.moveCanJump !== null ||
      input.moveConstraintsJson !== null ||
      input.moveRulesJson !== null)
  ) {
    await updateMovePatternSpecialConfig(movePatternId, {
      canJump: input.moveCanJump,
      constraintsJson: input.moveConstraintsJson,
      rules: input.moveRulesJson,
    });
  }

  let imageUpdate: {
    imageBucket: string;
    imageKey: string;
    imageVersion: number;
  } | null = null;

  if (input.imageFile) {
    const uploaded = await uploadPieceImage({
      pieceCode,
      imageFile: input.imageFile,
    });
    imageUpdate = {
      imageBucket: uploaded.imageBucket,
      imageKey: uploaded.imageKey,
      imageVersion: Math.max(1, existing.imageVersion + 1),
    };
  }

  const updated = await updatePiece(pieceId, {
    pieceCode,
    kanji: input.kanji,
    name: input.name,
    rarity: input.rarity,
    moveDescriptionJa: input.moveDescriptionJa,
    movePatternId,
    skillId,
    imageSource: imageUpdate ? "supabase" : input.imageSource,
    imageBucket: imageUpdate?.imageBucket ?? existing.imageBucket,
    imageKey: imageUpdate?.imageKey ?? existing.imageKey,
    imageVersion: imageUpdate?.imageVersion ?? input.imageVersion,
    isActive: input.isActive,
    publishedAt: input.publishedAt,
    unpublishedAt: input.unpublishedAt,
  });

  if (!updated) throw new Error("Failed to update piece");

  if (imageUpdate && existing.imageBucket && existing.imageKey) {
    try {
      await deletePieceImage({
        imageBucket: existing.imageBucket,
        imageKey: existing.imageKey,
      });
    } catch {
      // 旧画像削除失敗は無視（更新自体は成功）
    }
  }

  return updated;
}

// 駒削除
export async function deletePieceUseCase(
  pieceId: number,
): Promise<{ deleted: boolean }> {
  const existing = await getPieceById(pieceId);
  if (!existing) throw new Error(`Piece ${pieceId} not found`);

  await deletePiece(pieceId);

  if (existing.imageBucket && existing.imageKey) {
    try {
      await deletePieceImage({
        imageBucket: existing.imageBucket,
        imageKey: existing.imageKey,
      });
    } catch {
      // 画像削除失敗は無視（DBからの削除は成功）
    }
  }

  return { deleted: true };
}
