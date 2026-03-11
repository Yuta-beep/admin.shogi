import {
  listSkillDraftOptions,
  listMovePatterns,
  listPieces,
  listSkills,
} from "@/features/piece/api/dao/piece.dao";

export async function listPiecesUseCase() {
  const [pieces, movePatterns, skills, skillDraftOptions] = await Promise.all([
    listPieces(),
    listMovePatterns(),
    listSkills(),
    listSkillDraftOptions(),
  ]);

  return {
    pieces,
    movePatterns,
    skills,
    skillDraftOptions,
  };
}
