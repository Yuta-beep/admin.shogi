"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PieceOption,
  StagePlacementInput,
  StageRecord,
} from "@/features/stage/domain/stage.types";

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
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}

export function useStageManagement() {
  const [stages, setStages] = useState<StageRecord[]>([]);
  const [pieceOptions, setPieceOptions] = useState<PieceOption[]>([]);
  const [form, setForm] = useState<StageFormState>(initialForm);
  const [placements, setPlacements] = useState<StagePlacementInput[]>([]);
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
      return toJson<{
        stages: StageRecord[];
        pieces: PieceOption[];
      }>(res);
    },
    [],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const json = await fetchList({
        stageName: searchStageName,
        pieceIds: searchPieceIds,
      });
      setStages(json.stages);
      setPieceOptions(json.pieces);
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

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const dbPlacements = placements.map((placement) => ({
        ...placement,
        rowNo: placement.rowNo - DB_AI_ROW_OFFSET,
      }));

      const res = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          placements: dbPlacements,
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
  }, [form, placements, refresh, resetForm]);

  const search = useCallback(async () => {
    const nextStageName = searchStageNameInput.trim();
    const nextPieceIds = searchPieceIdsInput;
    setSearchStageName(nextStageName);
    setSearchPieceIds(nextPieceIds);
    setIsLoading(true);
    setError(null);
    try {
      const json = await fetchList({
        stageName: nextStageName,
        pieceIds: nextPieceIds,
      });
      setStages(json.stages);
      setPieceOptions(json.pieces);
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
      const json = await fetchList({ stageName: "", pieceIds: [] });
      setStages(json.stages);
      setPieceOptions(json.pieces);
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

  return {
    stages,
    pieceOptions,
    pieceById,
    form,
    placements,
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
    submit,
  };
}
