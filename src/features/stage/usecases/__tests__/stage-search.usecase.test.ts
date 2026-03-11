import { describe, expect, it } from "bun:test";
import { createStageSearchUseCase } from "@/features/stage/usecases/stage-search.usecase";

const stageA = {
  stageId: 1,
  stageNo: 101,
  stageName: "序章の戦い",
  unlockStageNo: null,
  difficulty: null,
  stageCategory: "normal",
  clearConditionType: "defeat_boss",
  clearConditionParams: null,
  recommendedPower: null,
  staminaCost: 5,
  isActive: true,
  publishedAt: null,
  unpublishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const stageB = {
  ...stageA,
  stageId: 2,
  stageNo: 102,
  stageName: "最終決戦",
};

describe("stageSearchUseCase", () => {
  it("filters by stage name", async () => {
    const usecase = createStageSearchUseCase({
      listStages: async () => [stageA, stageB],
      listPieceOptions: async () => [],
      listStagePieceUsages: async () => [],
    });

    const result = await usecase({ stageName: "序章" });
    expect(result.stages.map((stage) => stage.stageId)).toEqual([1]);
  });

  it("filters by used piece", async () => {
    const usecase = createStageSearchUseCase({
      listStages: async () => [stageA, stageB],
      listPieceOptions: async () => [],
      listStagePieceUsages: async () => [
        { stageId: 1, pieceId: 10 },
        { stageId: 2, pieceId: 20 },
      ],
    });

    const result = await usecase({ pieceIds: [20] });
    expect(result.stages.map((stage) => stage.stageId)).toEqual([2]);
  });

  it("filters by multiple pieces with OR condition", async () => {
    const usecase = createStageSearchUseCase({
      listStages: async () => [stageA, stageB],
      listPieceOptions: async () => [],
      listStagePieceUsages: async () => [
        { stageId: 1, pieceId: 10 },
        { stageId: 2, pieceId: 20 },
      ],
    });

    const result = await usecase({ pieceIds: [10, 20] });
    expect(result.stages.map((stage) => stage.stageId)).toEqual([1, 2]);
  });
});
