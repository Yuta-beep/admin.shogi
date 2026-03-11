"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PieceOption, RewardOption, StageRecord } from "@/api/model/stage";
import { StagePlacementInput } from "@/types/stage";

type StageFormState = {
  stageNo: string;
  stageName: string;
  unlockStageNo: string;
  stageCategory: string;
  clearConditionType: string;
  staminaCost: string;
  isActive: boolean;
  publishedAt: string;
  unpublishedAt: string;
};

type StageListResponse = {
  stages: StageRecord[];
  pieces: PieceOption[];
  rewardOptions: RewardOption[];
};
type StageRewardFormRow = {
  rewardId: string;
  rewardTiming: "first_clear" | "clear";
  quantity: string;
};

const initialForm: StageFormState = {
  stageNo: "",
  stageName: "",
  unlockStageNo: "",
  stageCategory: "normal",
  clearConditionType: "defeat_boss",
  staminaCost: "0",
  isActive: true,
  publishedAt: "",
  unpublishedAt: "",
};

const AI_UI_ROW_MIN = 6;
const AI_UI_ROW_MAX = 8;
const DB_AI_ROW_OFFSET = 6;

async function toJson<T>(res: Response): Promise<T> {
  const json = (await res.json()) as {
    success: boolean;
    data?: T;
    error?: string;
  };
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data as T;
}

export function useStageManagement() {
  const [stages, setStages] = useState<StageRecord[]>([]);
  const [pieceOptions, setPieceOptions] = useState<PieceOption[]>([]);
  const [rewardOptions, setRewardOptions] = useState<RewardOption[]>([]);
  const [form, setForm] = useState<StageFormState>(initialForm);
  const [placements, setPlacements] = useState<StagePlacementInput[]>([]);
  const [rewards, setRewards] = useState<StageRewardFormRow[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchStageNameInput, setSearchStageNameInput] = useState("");
  const [searchPieceIdsInput, setSearchPieceIdsInput] = useState<number[]>([]);
  const [searchStageName, setSearchStageName] = useState("");
  const [searchPieceIds, setSearchPieceIds] = useState<number[]>([]);

  const fetchList = useCallback(
    async (filters: { stageName: string; pieceIds: number[] }) => {
      const params = new URLSearchParams();
      if (filters.stageName.trim() !== "")
        params.set("stageName", filters.stageName.trim());
      for (const pieceId of filters.pieceIds) {
        params.append("pieceId", String(pieceId));
      }
      const path =
        params.size > 0 ? `/api/stages?${params.toString()}` : "/api/stages";
      const res = await fetch(path, { cache: "no-store" });
      return toJson<StageListResponse>(res);
    },
    [],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchList({
        stageName: searchStageName,
        pieceIds: searchPieceIds,
      });
      setStages(data.stages);
      setPieceOptions(data.pieces);
      setRewardOptions(data.rewardOptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [fetchList, searchPieceIds, searchStageName]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pieceById = useMemo(
    () =>
      Object.fromEntries(
        pieceOptions.map((piece) => [piece.pieceId, piece]),
      ) as Record<number, PieceOption>,
    [pieceOptions],
  );

  const onChange = useCallback(
    (key: keyof StageFormState, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setPlacements([]);
    setRewards([]);
    setSelectedPieceId(null);
  }, []);

  const setPlacementAt = useCallback(
    (rowNo: number, colNo: number) => {
      if (rowNo < AI_UI_ROW_MIN || rowNo > AI_UI_ROW_MAX) {
        return;
      }
      setPlacements((prev) => {
        const next = prev.filter(
          (p) => !(p.rowNo === rowNo && p.colNo === colNo),
        );
        if (!selectedPieceId) return next;
        next.push({
          side: "enemy",
          rowNo,
          colNo,
          pieceId: selectedPieceId,
        });
        return next;
      });
    },
    [selectedPieceId],
  );

  const clearPlacements = useCallback(() => {
    setPlacements([]);
  }, []);

  const addReward = useCallback(() => {
    setRewards((prev) => [
      ...prev,
      { rewardId: "", rewardTiming: "first_clear", quantity: "1" },
    ]);
  }, []);

  const removeReward = useCallback((index: number) => {
    setRewards((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const changeReward = useCallback(
    (
      index: number,
      key: keyof StageRewardFormRow,
      value: StageRewardFormRow[keyof StageRewardFormRow],
    ) => {
      setRewards((prev) =>
        prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
      );
    },
    [],
  );

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const dbPlacements = placements.map((placement) => ({
        ...placement,
        rowNo: placement.rowNo - DB_AI_ROW_OFFSET,
      }));

      const rewardRows = rewards
        .map((reward, index) => ({
          rewardId: Number(reward.rewardId),
          rewardTiming: reward.rewardTiming,
          quantity: Number(reward.quantity),
          sortOrder: index + 1,
        }))
        .filter(
          (reward) =>
            Number.isInteger(reward.rewardId) &&
            reward.rewardId > 0 &&
            Number.isInteger(reward.quantity) &&
            reward.quantity > 0 &&
            (reward.rewardTiming === "first_clear" ||
              reward.rewardTiming === "clear"),
        );

      const res = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          placements: dbPlacements,
          rewards: rewardRows,
        }),
      });

      await toJson<{ stage: StageRecord }>(res);
      await refresh();
      resetForm();
      setSuccessMessage("ステージを作成しました。");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  }, [form, placements, refresh, resetForm, rewards]);

  const search = useCallback(async () => {
    const nextStageName = searchStageNameInput.trim();
    const nextPieceIds = searchPieceIdsInput;
    setSearchStageName(nextStageName);
    setSearchPieceIds(nextPieceIds);
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchList({
        stageName: nextStageName,
        pieceIds: nextPieceIds,
      });
      setStages(data.stages);
      setPieceOptions(data.pieces);
      setRewardOptions(data.rewardOptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [fetchList, searchPieceIdsInput, searchStageNameInput]);

  const resetSearch = useCallback(async () => {
    setSearchStageNameInput("");
    setSearchPieceIdsInput([]);
    setSearchStageName("");
    setSearchPieceIds([]);
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchList({ stageName: "", pieceIds: [] });
      setStages(data.stages);
      setPieceOptions(data.pieces);
      setRewardOptions(data.rewardOptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [fetchList]);

  const toggleSearchPieceId = useCallback((pieceId: number) => {
    setSearchPieceIdsInput((prev) =>
      prev.includes(pieceId)
        ? prev.filter((id) => id !== pieceId)
        : [...prev, pieceId],
    );
  }, []);

  useEffect(() => {
    if (rewards.length > 0 || rewardOptions.length === 0) return;

    const pawn = rewardOptions.find(
      (reward) =>
        reward.rewardType === "currency" && reward.itemCode === "pawn",
    );
    const gold = rewardOptions.find(
      (reward) =>
        reward.rewardType === "currency" && reward.itemCode === "gold",
    );
    if (!pawn || !gold) return;

    setRewards([
      {
        rewardId: String(pawn.rewardId),
        rewardTiming: "first_clear",
        quantity: "10",
      },
      {
        rewardId: String(gold.rewardId),
        rewardTiming: "first_clear",
        quantity: "2",
      },
      {
        rewardId: String(pawn.rewardId),
        rewardTiming: "clear",
        quantity: "2",
      },
    ]);
  }, [rewardOptions, rewards.length]);

  return {
    stages,
    pieceOptions,
    pieceById,
    rewardOptions,
    form,
    placements,
    rewards,
    selectedPieceId,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    searchStageNameInput,
    searchPieceIdsInput,
    searchStageName,
    searchPieceIds,
    onChange,
    setSearchStageNameInput,
    toggleSearchPieceId,
    search,
    resetSearch,
    setSelectedPieceId,
    setPlacementAt,
    clearPlacements,
    addReward,
    removeReward,
    changeReward,
    submit,
  };
}
