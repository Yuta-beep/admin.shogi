import {
  createGachaUseCase,
  listGachasUseCase,
} from "@/api/useCase/gacha.useCase";
import { created, errorResponse, ok } from "@/api/helpers/apiResponse";
import { parseQuery } from "@/api/helpers/apiParams";
import { parseGachaFormBody } from "@/utils/gacha-form-parser";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseQuery(searchParams.get("query"));
    const data = await listGachasUseCase(query || undefined);
    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseGachaFormBody(body);
    const gacha = await createGachaUseCase(input);
    return created({ gacha });
  } catch (error) {
    return errorResponse(error);
  }
}
