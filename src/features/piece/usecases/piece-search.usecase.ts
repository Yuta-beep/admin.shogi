import { listPiecesUseCase } from "@/features/piece/usecases/list-pieces.usecase";

type PieceSearchDeps = {
  listPiecesUseCase: typeof listPiecesUseCase;
};

const defaultDeps: PieceSearchDeps = {
  listPiecesUseCase,
};

export function createPieceSearchUseCase(deps: PieceSearchDeps = defaultDeps) {
  return async function pieceSearchUseCase(query: string) {
    const payload = await deps.listPiecesUseCase();
    const keyword = query.trim().toLowerCase();

    if (!keyword) return payload;

    const pieces = payload.pieces.filter((piece) => {
      const kanji = piece.kanji.toLowerCase();
      const skillDesc = (piece.skillDesc ?? "").toLowerCase();
      return kanji.includes(keyword) || skillDesc.includes(keyword);
    });

    return {
      ...payload,
      pieces,
    };
  };
}

export const pieceSearchUseCase = createPieceSearchUseCase();
export const PieceSearchUseCase = pieceSearchUseCase;
export const PieceSearchUsecase = pieceSearchUseCase;
