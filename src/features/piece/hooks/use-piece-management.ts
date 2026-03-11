"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MovePatternOption,
  MovePatternVector,
  PieceRecord,
  SkillEffectRecord,
  SkillDraftOptions,
  SkillOption,
} from "@/features/piece/domain/piece.types";

type PieceFormState = {
  pieceId: number | null;
  kanji: string;
  name: string;
  movePatternId: string;
  moveVectorsJson: string;
  hasSkill: boolean;
  skillId: string;
  skillDesc: string;
  skillEffectType: string;
  skillTargetRule: string;
  skillTargetAdjacentN: string;
  skillTriggerTiming: string;
  skillValueText: string;
  skillValueNum: string;
  skillProcChance: string;
  skillDurationTurns: string;
  skillRadius: string;
  skillParamsJson: string;
  imageVersion: string;
  isActive: boolean;
  publishedAt: string;
  unpublishedAt: string;
  imageFile: File | null;
};

type PieceDetailResponse = {
  piece: PieceRecord;
  skillEffects: SkillEffectRecord[];
  moveVectors: MovePatternVector[];
  imageUrl: string | null;
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

function toFormState(piece?: PieceRecord): PieceFormState {
  return {
    pieceId: piece?.pieceId ?? null,
    kanji: piece?.kanji ?? "",
    name: piece?.name ?? "",
    movePatternId: piece?.movePatternId ? String(piece.movePatternId) : "",
    moveVectorsJson: "",
    hasSkill: Boolean(piece?.skillId),
    skillId: piece?.skillId ? String(piece.skillId) : "",
    skillDesc: "",
    skillEffectType: "",
    skillTargetRule: "",
    skillTargetAdjacentN: "",
    skillTriggerTiming: "",
    skillValueText: "",
    skillValueNum: "",
    skillProcChance: "",
    skillDurationTurns: "",
    skillRadius: "",
    skillParamsJson: "",
    imageVersion: String(piece?.imageVersion ?? 1),
    isActive: piece?.isActive ?? true,
    publishedAt: toDateTimeLocal(piece?.publishedAt ?? null),
    unpublishedAt: toDateTimeLocal(piece?.unpublishedAt ?? null),
    imageFile: null,
  };
}

function toEditFormState(detail: PieceDetailResponse): PieceFormState {
  const firstEffect = detail.skillEffects[0] ?? null;
  const targetRule = firstEffect?.targetRule ?? "";
  const adjacentMatch = targetRule.match(/^adjacent_(\d+)$/);
  const isAdjacentCustom = Boolean(adjacentMatch);

  return {
    pieceId: detail.piece.pieceId,
    kanji: detail.piece.kanji,
    name: detail.piece.name,
    movePatternId: String(detail.piece.movePatternId),
    moveVectorsJson: "",
    hasSkill: Boolean(detail.piece.skillId),
    skillId: detail.piece.skillId ? String(detail.piece.skillId) : "",
    skillDesc: detail.piece.skillDesc ?? "",
    skillEffectType: firstEffect?.effectType ?? "",
    skillTargetRule: isAdjacentCustom ? "__adjacent_custom__" : targetRule,
    skillTargetAdjacentN: adjacentMatch?.[1] ?? "",
    skillTriggerTiming: firstEffect?.triggerTiming ?? "",
    skillValueText: firstEffect?.valueText ?? "",
    skillValueNum:
      firstEffect?.valueNum !== null && firstEffect?.valueNum !== undefined
        ? String(firstEffect.valueNum)
        : "",
    skillProcChance:
      firstEffect?.procChance !== null && firstEffect?.procChance !== undefined
        ? String(firstEffect.procChance)
        : "",
    skillDurationTurns:
      firstEffect?.durationTurns !== null &&
      firstEffect?.durationTurns !== undefined
        ? String(firstEffect.durationTurns)
        : "",
    skillRadius:
      firstEffect?.radius !== null && firstEffect?.radius !== undefined
        ? String(firstEffect.radius)
        : "",
    skillParamsJson: "",
    imageVersion: String(detail.piece.imageVersion ?? 1),
    isActive: detail.piece.isActive ?? true,
    publishedAt: toDateTimeLocal(detail.piece.publishedAt ?? null),
    unpublishedAt: toDateTimeLocal(detail.piece.unpublishedAt ?? null),
    imageFile: null,
  };
}

function buildFormData(state: PieceFormState) {
  const formData = new FormData();
  formData.set("kanji", state.kanji.trim());
  formData.set("name", state.name.trim());
  formData.set("movePatternId", state.movePatternId);
  formData.set("moveVectorsJson", state.moveVectorsJson);
  formData.set("hasSkill", String(state.hasSkill));
  formData.set("skillId", state.skillId);
  formData.set("skillDesc", state.skillDesc.trim());
  formData.set("skillEffectType", state.skillEffectType.trim());
  let normalizedTargetRule = state.skillTargetRule.trim();
  if (state.skillTargetRule === "__adjacent_custom__") {
    const adjacentN = Number(state.skillTargetAdjacentN.trim());
    if (!Number.isInteger(adjacentN) || adjacentN <= 0) {
      throw new Error("周囲nマスの数値は1以上の整数で入力してください");
    }
    normalizedTargetRule = `adjacent_${adjacentN}`;
  }
  formData.set("skillTargetRule", normalizedTargetRule);
  formData.set("skillTriggerTiming", state.skillTriggerTiming.trim());
  formData.set("skillValueText", state.skillValueText.trim());
  formData.set("skillValueNum", state.skillValueNum.trim());
  formData.set("skillProcChance", state.skillProcChance.trim());
  formData.set("skillDurationTurns", state.skillDurationTurns.trim());
  formData.set("skillRadius", state.skillRadius.trim());
  formData.set("skillParamsJson", state.skillParamsJson.trim());
  formData.set("imageSource", "supabase");
  formData.set("imageVersion", state.imageVersion || "1");
  formData.set("isActive", String(state.isActive));
  formData.set("publishedAt", state.publishedAt);
  formData.set("unpublishedAt", state.unpublishedAt);

  if (state.imageFile) {
    formData.set("image", state.imageFile);
  }

  return formData;
}

async function toJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    const message = (data as { error?: string }).error ?? "Request failed";
    throw new Error(message);
  }
  return data;
}

export function usePieceManagement() {
  const [pieces, setPieces] = useState<PieceRecord[]>([]);
  const [movePatterns, setMovePatterns] = useState<MovePatternOption[]>([]);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [skillDraftOptions, setSkillDraftOptions] = useState<SkillDraftOptions>(
    {
      effectTypes: [],
      targetRules: [],
      triggerTimings: [],
    },
  );
  const [form, setForm] = useState<PieceFormState>(toFormState());
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
      params.size > 0 ? `/api/pieces?${params.toString()}` : "/api/pieces";
    const res = await fetch(path, { cache: "no-store" });
    return toJson<{
      pieces: PieceRecord[];
      movePatterns: MovePatternOption[];
      skills: SkillOption[];
      skillDraftOptions: SkillDraftOptions;
    }>(res);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const json = await fetchList(query);
      setPieces(json.pieces);
      setMovePatterns(json.movePatterns);
      setSkills(json.skills);
      setSkillDraftOptions(json.skillDraftOptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [fetchList, query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isEditMode = useMemo(() => form.pieceId !== null, [form.pieceId]);

  const onChange = useCallback(
    (key: keyof PieceFormState, value: string | boolean | File | null) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setForm(toFormState());
  }, []);

  const search = useCallback(async () => {
    const nextQuery = queryInput.trim();
    setQuery(nextQuery);
    setIsLoading(true);
    setError(null);
    try {
      const json = await fetchList(nextQuery);
      setPieces(json.pieces);
      setMovePatterns(json.movePatterns);
      setSkills(json.skills);
      setSkillDraftOptions(json.skillDraftOptions);
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
      const json = await fetchList("");
      setPieces(json.pieces);
      setMovePatterns(json.movePatterns);
      setSkills(json.skills);
      setSkillDraftOptions(json.skillDraftOptions);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [fetchList]);

  const startEdit = useCallback((piece: PieceRecord) => {
    setForm(toFormState(piece));
    setSuccessMessage(null);
    setError(null);
  }, []);

  const startEditById = useCallback(async (pieceId: number) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/pieces/${pieceId}`, { cache: "no-store" });
      const detail = await toJson<PieceDetailResponse>(res);
      setForm(toEditFormState(detail));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = buildFormData(form);
      const method = isEditMode ? "PUT" : "POST";
      const endpoint = isEditMode
        ? `/api/pieces/${form.pieceId}`
        : "/api/pieces";

      const res = await fetch(endpoint, {
        method,
        body: formData,
      });

      await toJson<{ piece: PieceRecord }>(res);
      await refresh();
      resetForm();
      setSuccessMessage(
        isEditMode ? "駒を更新しました。" : "駒を作成しました。",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
  }, [form, isEditMode, refresh, resetForm]);

  const remove = useCallback(
    async (pieceId: number) => {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const res = await fetch(`/api/pieces/${pieceId}`, {
          method: "DELETE",
        });

        await toJson<{ deleted: boolean }>(res);
        await refresh();
        if (form.pieceId === pieceId) {
          resetForm();
        }
        setSuccessMessage("駒を削除しました。");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsSubmitting(false);
      }
    },
    [form.pieceId, refresh, resetForm],
  );

  return {
    pieces,
    movePatterns,
    skills,
    skillDraftOptions,
    form,
    isEditMode,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    queryInput,
    query,
    onChange,
    setQueryInput,
    search,
    resetSearch,
    startEdit,
    startEditById,
    resetForm,
    submit,
    remove,
  };
}
