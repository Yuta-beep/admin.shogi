import { getStageDetailUseCase } from "@/api/useCase/stage.useCase";
import { errorResponse, ok, notFound } from "@/api/helpers/apiResponse";
import { parseStageId } from "@/api/helpers/apiParams";

export const runtime = "nodejs";

type Params = { params: { stageId: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const stageId = parseStageId(params.stageId);
    const detail = await getStageDetailUseCase(stageId);
    if (!detail) return notFound("Stage not found");
    return ok(detail);
  } catch (error) {
    return errorResponse(error);
  }
}
