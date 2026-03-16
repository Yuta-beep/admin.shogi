import { getSkillDefinitionUseCase } from "@/api/useCase/piece.useCase";
import { errorResponse, notFound, ok } from "@/api/helpers/apiResponse";

export const runtime = "nodejs";

type Params = { params: { skillId: string } };

function parseSkillId(raw: string) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Invalid skillId");
  }
  return value;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const skillId = parseSkillId(params.skillId);
    const detail = await getSkillDefinitionUseCase(skillId);
    if (!detail) return notFound("Skill not found");
    return ok(detail);
  } catch (error) {
    return errorResponse(error);
  }
}
