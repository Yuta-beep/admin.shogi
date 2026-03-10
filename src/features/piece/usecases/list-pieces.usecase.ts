import {
  listMovePatterns,
  listPieces,
  listSkills,
} from "@/features/piece/api/dao/piece.dao";

export async function listPiecesUseCase() {
  const [pieces, movePatterns, skills] = await Promise.all([
    listPieces(),
    listMovePatterns(),
    listSkills(),
  ]);

  return {
    pieces,
    movePatterns,
    skills,
  };
}
