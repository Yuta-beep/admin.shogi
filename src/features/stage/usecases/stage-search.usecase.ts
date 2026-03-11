import {
  listPieceOptions,
  listStagePieceUsages,
  listStages,
} from "@/features/stage/api/dao/stage.dao";

type StageSearchInput = {
  stageName?: string;
  pieceIds?: number[];
};

type StageSearchDeps = {
  listStages: typeof listStages;
  listPieceOptions: typeof listPieceOptions;
  listStagePieceUsages: typeof listStagePieceUsages;
};

const defaultDeps: StageSearchDeps = {
  listStages,
  listPieceOptions,
  listStagePieceUsages,
};

export function createStageSearchUseCase(deps: StageSearchDeps = defaultDeps) {
  return async function stageSearchUseCase(input: StageSearchInput) {
    const [stages, pieces, stagePieceUsages] = await Promise.all([
      deps.listStages(),
      deps.listPieceOptions(),
      deps.listStagePieceUsages(),
    ]);

    const keyword = (input.stageName ?? "").trim().toLowerCase();
    const normalizedPieceIds = Array.from(
      new Set(
        (input.pieceIds ?? []).filter(
          (pieceId) => Number.isInteger(pieceId) && pieceId > 0,
        ),
      ),
    );
    const hasPieceFilter = normalizedPieceIds.length > 0;

    const matchedStageIds = hasPieceFilter
      ? new Set(
          stagePieceUsages
            .filter((usage) => normalizedPieceIds.includes(usage.pieceId))
            .map((usage) => usage.stageId),
        )
      : null;

    const filteredStages = stages.filter((stage) => {
      if (keyword && !stage.stageName.toLowerCase().includes(keyword)) {
        return false;
      }
      if (matchedStageIds && !matchedStageIds.has(stage.stageId)) {
        return false;
      }
      return true;
    });

    return {
      stages: filteredStages,
      pieces,
    };
  };
}

export const stageSearchUseCase = createStageSearchUseCase();
export const StageSearchUseCase = stageSearchUseCase;
export const StageSearchUsecase = stageSearchUseCase;
