"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GachaPieceOption,
  GachaRecord,
  GachaTargetPieceRecord,
} from "@/api/model/gacha";

type GachaListItem = GachaRecord & {
  pieceCount: number;
};

type GachaListResponse = {
  gachas: GachaListItem[];
  pieceOptions: GachaPieceOption[];
};

type GachaDetailResponse = {
  gacha: GachaRecord;
  targetPieces: GachaTargetPieceRecord[];
};

type GachaFormState = {
  gachaId: number | null;
  gachaCode: string;
  gachaName: string;
  description: string;
  rarityRateN: string;
  rarityRateR: string;
  rarityRateSr: string;
  rarityRateUr: string;
  rarityRateSsr: string;
  pawnCost: string;
  goldCost: string;
  imageSource: string;
  imageBucket: string;
  imageKey: string;
  imageVersion: string;
  isActive: boolean;
  publishedAt: string;
  unpublishedAt: string;
};

type PieceSelection = {
  selected: boolean;
  weight: string;
  isActive: boolean;
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function toFormState(gacha?: GachaRecord): GachaFormState {
  return {
    gachaId: gacha?.gachaId ?? null,
    gachaCode: gacha?.gachaCode ?? "",
    gachaName: gacha?.gachaName ?? "",
    description: gacha?.description ?? "",
    rarityRateN: String(gacha?.rarityRateN ?? 0),
    rarityRateR: String(gacha?.rarityRateR ?? 0),
    rarityRateSr: String(gacha?.rarityRateSr ?? 0),
    rarityRateUr: String(gacha?.rarityRateUr ?? 0),
    rarityRateSsr: String(gacha?.rarityRateSsr ?? 0),
    pawnCost: String(gacha?.pawnCost ?? 30),
    goldCost: String(gacha?.goldCost ?? 0),
    imageSource: gacha?.imageSource ?? "supabase",
    imageBucket: gacha?.imageBucket ?? "gacha-images",
    imageKey: gacha?.imageKey ?? "",
    imageVersion: String(gacha?.imageVersion ?? 1),
    isActive: gacha?.isActive ?? true,
    publishedAt: toDateTimeLocal(gacha?.publishedAt ?? null),
    unpublishedAt: toDateTimeLocal(gacha?.unpublishedAt ?? null),
  };
}

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

function toInput(
  form: GachaFormState,
  selectionByPieceId: Record<number, PieceSelection>,
) {
  const targetPieces = Object.entries(selectionByPieceId)
    .map(([pieceId, entry]) => ({
      pieceId: Number(pieceId),
      selected: entry.selected,
      weight: Number(entry.weight),
      isActive: entry.isActive,
    }))
    .filter((entry) => entry.selected)
    .map((entry) => ({
      pieceId: entry.pieceId,
      weight:
        Number.isInteger(entry.weight) && entry.weight > 0 ? entry.weight : 1,
      isActive: entry.isActive,
    }));

  return {
    gachaCode: form.gachaCode.trim(),
    gachaName: form.gachaName.trim(),
    description: form.description.trim(),
    rarityRateN: Number(form.rarityRateN),
    rarityRateR: Number(form.rarityRateR),
    rarityRateSr: Number(form.rarityRateSr),
    rarityRateUr: Number(form.rarityRateUr),
    rarityRateSsr: Number(form.rarityRateSsr),
    pawnCost: Number(form.pawnCost),
    goldCost: Number(form.goldCost),
    imageSource: form.imageSource.trim(),
    imageBucket: form.imageBucket.trim(),
    imageKey: form.imageKey.trim(),
    imageVersion: Number(form.imageVersion),
    isActive: form.isActive,
    publishedAt: form.publishedAt,
    unpublishedAt: form.unpublishedAt,
    targetPieces,
  };
}

export function useGachaManagement() {
  const [gachas, setGachas] = useState<GachaListItem[]>([]);
  const [pieceOptions, setPieceOptions] = useState<GachaPieceOption[]>([]);
  const [form, setForm] = useState<GachaFormState>(toFormState());
  const [selectionByPieceId, setSelectionByPieceId] = useState<
    Record<number, PieceSelection>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");

  const fetchList = useCallback(async (nextQuery: string) => {
    const params = new URLSearchParams();
    if (nextQuery.trim() !== "") {
      params.set("query", nextQuery.trim());
    }
    const path =
      params.size > 0 ? `/api/gachas?${params.toString()}` : "/api/gachas";
    const res = await fetch(path, { cache: "no-store" });
    return toJson<GachaListResponse>(res);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchList(query);
      setGachas(data.gachas);
      setPieceOptions(data.pieceOptions);
      setSelectionByPieceId((prev) => {
        const next: Record<number, PieceSelection> = {};
        for (const piece of data.pieceOptions) {
          next[piece.pieceId] = prev[piece.pieceId] ?? {
            selected: false,
            weight: "1",
            isActive: true,
          };
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [fetchList, query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isEditMode = useMemo(() => form.gachaId !== null, [form.gachaId]);

  const onChange = useCallback(
    (key: keyof GachaFormState, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setForm(toFormState());
    setSelectionByPieceId((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[Number(key)] = { selected: false, weight: "1", isActive: true };
      }
      return next;
    });
  }, []);

  const search = useCallback(async () => {
    const nextQuery = queryInput.trim();
    setQuery(nextQuery);
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchList(nextQuery);
      setGachas(data.gachas);
      setPieceOptions(data.pieceOptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [fetchList, queryInput]);

  const resetSearch = useCallback(async () => {
    setQueryInput("");
    setQuery("");
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchList("");
      setGachas(data.gachas);
      setPieceOptions(data.pieceOptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [fetchList]);

  const startEditById = useCallback(
    async (gachaId: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/gachas/${gachaId}`, {
          cache: "no-store",
        });
        const detail = await toJson<GachaDetailResponse>(res);
        setForm(toFormState(detail.gacha));
        setSelectionByPieceId((prev) => {
          const next: Record<number, PieceSelection> = {};
          for (const piece of pieceOptions) {
            next[piece.pieceId] = prev[piece.pieceId] ?? {
              selected: false,
              weight: "1",
              isActive: true,
            };
          }
          for (const target of detail.targetPieces) {
            next[target.pieceId] = {
              selected: true,
              weight: String(target.weight),
              isActive: target.isActive,
            };
          }
          return next;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    },
    [pieceOptions],
  );

  const togglePieceSelection = useCallback((pieceId: number) => {
    setSelectionByPieceId((prev) => ({
      ...prev,
      [pieceId]: {
        ...(prev[pieceId] ?? { selected: false, weight: "1", isActive: true }),
        selected: !(prev[pieceId]?.selected ?? false),
      },
    }));
  }, []);

  const setPieceWeight = useCallback((pieceId: number, weight: string) => {
    setSelectionByPieceId((prev) => ({
      ...prev,
      [pieceId]: {
        ...(prev[pieceId] ?? { selected: true, weight: "1", isActive: true }),
        weight,
      },
    }));
  }, []);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const input = toInput(form, selectionByPieceId);
      const path = isEditMode ? `/api/gachas/${form.gachaId}` : "/api/gachas";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await toJson<{ gacha: GachaRecord }>(res);

      await refresh();
      if (!isEditMode) {
        resetForm();
      }
      setSuccessMessage(
        isEditMode ? "ガチャを更新しました。" : "ガチャを作成しました。",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isEditMode, refresh, resetForm, selectionByPieceId]);

  return {
    gachas,
    pieceOptions,
    form,
    selectionByPieceId,
    isEditMode,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    queryInput,
    onChange,
    setQueryInput,
    search,
    resetSearch,
    startEditById,
    togglePieceSelection,
    setPieceWeight,
    resetForm,
    submit,
  };
}
