import {
  MovePatternOption,
  PieceRecord,
  SkillDefinitionRecord,
  SkillOption,
  SkillRegistryDocument,
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
  getSkillDefinitionBySkillId,
  insertSkillDefinitionV2,
  listSkillRegistry,
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

type PieceUseCaseDeps = {
  listPieces: typeof listPieces;
  listMovePatterns: typeof listMovePatterns;
  listSkills: typeof listSkills;
  listSkillRegistry: typeof listSkillRegistry;
  getPieceById: typeof getPieceById;
  getSkillDefinitionBySkillId: typeof getSkillDefinitionBySkillId;
  listMoveVectorsByMovePatternId: typeof listMoveVectorsByMovePatternId;
  getMovePatternDetailById: typeof getMovePatternDetailById;
  createSignedImageUrl: typeof createSignedImageUrl;
  insertSkillDefinitionV2: typeof insertSkillDefinitionV2;
  insertMovePatternWithVectors: typeof insertMovePatternWithVectors;
  updateMovePatternSpecialConfig: typeof updateMovePatternSpecialConfig;
  uploadPieceImage: typeof uploadPieceImage;
  insertPiece: typeof insertPiece;
  updatePiece: typeof updatePiece;
  deletePieceImage: typeof deletePieceImage;
  deletePiece: typeof deletePiece;
};

const defaultDeps: PieceUseCaseDeps = {
  listPieces,
  listMovePatterns,
  listSkills,
  listSkillRegistry,
  getPieceById,
  getSkillDefinitionBySkillId,
  listMoveVectorsByMovePatternId,
  getMovePatternDetailById,
  createSignedImageUrl,
  insertSkillDefinitionV2,
  insertMovePatternWithVectors,
  updateMovePatternSpecialConfig,
  uploadPieceImage,
  insertPiece,
  updatePiece,
  deletePieceImage,
  deletePiece,
};

export type PieceListResponse = {
  pieces: PieceRecord[];
  movePatterns: MovePatternOption[];
  skills: SkillOption[];
  skillRegistry: SkillRegistryDocument;
};

export type PieceDetailResponse = {
  piece: PieceRecord;
  skillDefinition: SkillDefinitionRecord | null;
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

export async function listPiecesUseCase(
  query?: string,
  deps: PieceUseCaseDeps = defaultDeps,
): Promise<PieceListResponse> {
  const [pieces, movePatterns, skills, skillRegistry] = await Promise.all([
    deps.listPieces(),
    deps.listMovePatterns(),
    deps.listSkills(),
    deps.listSkillRegistry(),
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

  return { pieces: filteredPieces, movePatterns, skills, skillRegistry };
}

export async function getPieceDetailUseCase(
  pieceId: number,
  deps: PieceUseCaseDeps = defaultDeps,
): Promise<PieceDetailResponse | null> {
  const piece = await deps.getPieceById(pieceId);
  if (!piece) return null;

  const [skillDefinition, moveVectors, movePattern, imageUrl] =
    await Promise.all([
      piece.skillId
        ? deps.getSkillDefinitionBySkillId(piece.skillId)
        : Promise.resolve(null),
      deps.listMoveVectorsByMovePatternId(piece.movePatternId),
      deps.getMovePatternDetailById(piece.movePatternId),
      piece.imageBucket && piece.imageKey
        ? deps.createSignedImageUrl(piece.imageBucket, piece.imageKey)
        : Promise.resolve(null),
    ]);

  return { piece, skillDefinition, moveVectors, movePattern, imageUrl };
}

export async function getSkillDefinitionUseCase(
  skillId: number,
  deps: Pick<PieceUseCaseDeps, "getSkillDefinitionBySkillId"> = defaultDeps,
): Promise<SkillDefinitionRecord | null> {
  return deps.getSkillDefinitionBySkillId(skillId);
}

export async function createPieceUseCase(
  input: PieceFormInput,
  deps: PieceUseCaseDeps = defaultDeps,
): Promise<PieceRecord> {
  const pieceCode = normalizePieceCode(input.pieceCode) ?? generatePieceCode();

  const skillId = input.skillDraft
    ? await deps.insertSkillDefinitionV2(input.skillDraft)
    : input.skillId;

  const movePatternId =
    input.moveVectors.length > 0
      ? await deps.insertMovePatternWithVectors(
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
    await deps.updateMovePatternSpecialConfig(input.movePatternId, {
      canJump: input.moveCanJump,
      constraintsJson: input.moveConstraintsJson,
      rules: input.moveRulesJson,
    });
  }

  const image = input.imageFile
    ? await deps.uploadPieceImage({ pieceCode, imageFile: input.imageFile })
    : null;

  const created = await deps.insertPiece({
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

export async function updatePieceUseCase(
  pieceId: number,
  input: PieceFormInput,
  deps: PieceUseCaseDeps = defaultDeps,
): Promise<PieceRecord> {
  const existing = await deps.getPieceById(pieceId);
  if (!existing) throw new Error(`Piece ${pieceId} not found`);

  const pieceCode = normalizePieceCode(input.pieceCode) ?? existing.pieceCode;

  const skillId = input.skillDraft
    ? await deps.insertSkillDefinitionV2(input.skillDraft)
    : input.skillId;

  const movePatternId =
    input.moveVectors.length > 0
      ? await deps.insertMovePatternWithVectors(
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
    await deps.updateMovePatternSpecialConfig(movePatternId, {
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
    const uploaded = await deps.uploadPieceImage({
      pieceCode,
      imageFile: input.imageFile,
    });
    imageUpdate = {
      imageBucket: uploaded.imageBucket,
      imageKey: uploaded.imageKey,
      imageVersion: Math.max(1, existing.imageVersion + 1),
    };
  }

  const updated = await deps.updatePiece(pieceId, {
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
      await deps.deletePieceImage({
        imageBucket: existing.imageBucket,
        imageKey: existing.imageKey,
      });
    } catch {
      // Keep the piece update even if old image cleanup fails.
    }
  }

  return updated;
}

export async function deletePieceUseCase(
  pieceId: number,
  deps: Pick<
    PieceUseCaseDeps,
    "getPieceById" | "deletePieceImage" | "deletePiece"
  > = defaultDeps,
): Promise<{ deleted: boolean }> {
  const existing = await deps.getPieceById(pieceId);
  if (!existing) throw new Error(`Piece ${pieceId} not found`);

  if (existing.imageBucket && existing.imageKey) {
    try {
      await deps.deletePieceImage({
        imageBucket: existing.imageBucket,
        imageKey: existing.imageKey,
      });
    } catch {
      // Ignore image cleanup failures and continue deleting the DB row.
    }
  }

  await deps.deletePiece(pieceId);
  return { deleted: true };
}
