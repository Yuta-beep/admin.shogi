import { existsStageNo, insertStage } from "@/features/stage/api/dao/stage.dao";
import { StageFormInput } from "@/features/stage/domain/stage.types";

export async function createStageUseCase(input: StageFormInput) {
  const alreadyExists = await existsStageNo(input.stageNo);
  if (alreadyExists) {
    throw new Error(`stageNo ${input.stageNo} already exists`);
  }
  return insertStage(input);
}
