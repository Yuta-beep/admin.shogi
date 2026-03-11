import {
  getGachaDetailUseCase,
  updateGachaUseCase,
} from "@/api/useCase/gacha.useCase";
import { errorResponse, notFound, ok } from "@/api/helpers/apiResponse";
import { parseGachaId } from "@/api/helpers/apiParams";
import { parseGachaFormBody } from "@/utils/gacha-form-parser";

export const runtime = "nodejs";

type Params = { params: { gachaId: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const gachaId = parseGachaId(params.gachaId);
    const detail = await getGachaDetailUseCase(gachaId);
    if (!detail) return notFound("Gacha not found");
    return ok(detail);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const gachaId = parseGachaId(params.gachaId);
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseGachaFormBody(body);
    const gacha = await updateGachaUseCase(gachaId, input);
    return ok({ gacha });
  } catch (error) {
    return errorResponse(error);
  }
}
