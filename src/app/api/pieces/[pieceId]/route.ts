import {
  deletePieceUseCase,
  getPieceDetailUseCase,
  updatePieceUseCase,
} from "@/api/useCase/piece.useCase";
import { errorResponse, ok, notFound } from "@/api/helpers/apiResponse";
import { parsePieceId } from "@/api/helpers/apiParams";
import { parsePieceFormData } from "@/utils/piece-form-parser";

export const runtime = "nodejs";

type Params = { params: { pieceId: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const pieceId = parsePieceId(params.pieceId);
    const detail = await getPieceDetailUseCase(pieceId);
    if (!detail) return notFound("Piece not found");
    return ok(detail);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const pieceId = parsePieceId(params.pieceId);
    const formData = await request.formData();
    const input = parsePieceFormData(formData);
    const piece = await updatePieceUseCase(pieceId, input);
    return ok({ piece });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const pieceId = parsePieceId(params.pieceId);
    const result = await deletePieceUseCase(pieceId);
    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
