import {
  listPieceOptions,
  listStages,
} from "@/features/stage/api/dao/stage.dao";

export async function listStagesUseCase() {
  const [stages, pieces] = await Promise.all([
    listStages(),
    listPieceOptions(),
  ]);
  return { stages, pieces };
}
