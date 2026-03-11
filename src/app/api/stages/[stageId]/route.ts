import {
  getStageDetailUseCase,
  updateStageRewardsUseCase,
} from "@/api/useCase/stage.useCase";
import {
  badRequest,
  errorResponse,
  ok,
  notFound,
} from "@/api/helpers/apiResponse";
import { parseStageId } from "@/api/helpers/apiParams";
import { StageRewardInput } from "@/types/stage";

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

function isValidReward(value: unknown): value is StageRewardInput {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  const rewardId = Number(obj.rewardId);
  const quantity = Number(obj.quantity);
  const rewardTiming = obj.rewardTiming;

  return (
    Number.isInteger(rewardId) &&
    rewardId > 0 &&
    (rewardTiming === "first_clear" || rewardTiming === "clear") &&
    Number.isInteger(quantity) &&
    quantity > 0
  );
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const stageId = parseStageId(params.stageId);
    const body = (await request.json()) as Record<string, unknown>;
    const rewardsRaw = Array.isArray(body.rewards) ? body.rewards : null;

    if (!rewardsRaw) {
      return badRequest("rewards is required");
    }
    if (!rewardsRaw.every((reward) => isValidReward(reward))) {
      return badRequest(
        "rewards must contain rewardId, rewardTiming(first_clear|clear), quantity(>=1)",
      );
    }

    const rewards = rewardsRaw as StageRewardInput[];
    const updatedRewards = await updateStageRewardsUseCase(stageId, rewards);
    if (!updatedRewards) return notFound("Stage not found");

    return ok({ rewards: updatedRewards });
  } catch (error) {
    return errorResponse(error);
  }
}
