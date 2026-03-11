import {
  createPieceUseCase,
  listPiecesUseCase,
} from "@/api/useCase/piece.useCase";
import { errorResponse, ok, created } from "@/api/helpers/apiResponse";
import { parseQuery } from "@/api/helpers/apiParams";
import { parsePieceFormData } from "@/utils/piece-form-parser";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseQuery(searchParams.get("query"));
    const data = await listPiecesUseCase(query || undefined);
    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const input = parsePieceFormData(formData);
    const piece = await createPieceUseCase(input);
    return created({ piece });
  } catch (error) {
    return errorResponse(error);
  }
}
