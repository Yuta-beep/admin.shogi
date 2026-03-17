"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MovePatternOption,
  MovePatternVector,
  PieceRecord,
  SkillDefinitionRecord,
  SkillOption,
  SkillRegistryDocument,
} from "@/api/model/piece";
import {
  buildSkillDraftFormValuesFromDefinition,
  createEmptySkillDraftConditionFormState,
  createEmptySkillDraftEffectFormState,
  createEmptySkillDraftFormValues,
  SkillDraftConditionFormState,
  SkillDraftEffectFormState,
} from "@/utils/skill-form-state";

export type SkillMode = "existing" | "draft";

export type PieceFormState = {
  pieceId: number | null;
  kanji: string;
  name: string;
  rarity: "N" | "R" | "SR" | "UR" | "SSR";
  moveDescriptionJa: string;
  movePatternId: string;
  moveVectorsJson: string;
  moveCanJump: boolean;
  specialMoveType:
    | "none"
    | "immobile"
    | "turn_parity_moon"
    | "copy_front_enemy_move"
    | "copy_last_enemy_move";
  hasSkill: boolean;
  skillMode: SkillMode;
  skillId: string;
  skillDesc: string;
  implementationKind: string;
  skillTriggerGroup: string;
  skillTriggerType: string;
  scriptHook: string;
  skillTagsCsv: string;
  skillConditions: SkillDraftConditionFormState[];
  skillEffects: SkillDraftEffectFormState[];
  imageVersion: string;
  isActive: boolean;
  publishedAt: string;
  unpublishedAt: string;
  imageFile: File | null;
};

type PieceDetailResponse = {
  piece: PieceRecord;
  skillDefinition: SkillDefinitionRecord | null;
  moveVectors: MovePatternVector[];
  movePattern: {
    id: number;
    moveCode: string;
    moveName: string;
    isRepeatable: boolean;
    canJump: boolean;
    constraintsJson: Record<string, unknown> | null;
    rules: {
      ruleType: string;
      priority: number;
      paramsJson: Record<string, unknown> | null;
    }[];
  } | null;
  imageUrl: string | null;
};

type PieceListResponse = {
  pieces: PieceRecord[];
  movePatterns: MovePatternOption[];
  skills: SkillOption[];
  skillRegistry: SkillRegistryDocument;
};

function emptySkillRegistry(): SkillRegistryDocument {
  return {
    version: "skill-registry-v2-db",
    updatedAt: new Date(0).toISOString(),
    implementationKinds: [],
    registries: {
      trigger: { groups: [] },
      target: { groups: [] },
      effect: { groups: [] },
      condition: { groups: [] },
      param: { groups: [] },
    },
  };
}

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
  const draft = createEmptySkillDraftFormValues();
  return {
    pieceId: piece?.pieceId ?? null,
    kanji: piece?.kanji ?? "",
    name: piece?.name ?? "",
    rarity: piece?.rarity ?? "N",
    moveDescriptionJa: piece?.moveDescriptionJa ?? "",
    movePatternId: piece?.movePatternId ? String(piece.movePatternId) : "",
    moveVectorsJson: "",
    moveCanJump: false,
    specialMoveType: "none",
    hasSkill: Boolean(piece?.skillId),
    skillMode: "existing",
    skillId: piece?.skillId ? String(piece.skillId) : "",
    skillDesc: draft.skillDesc,
    implementationKind: draft.implementationKind,
    skillTriggerGroup: draft.triggerGroup,
    skillTriggerType: draft.triggerType,
    scriptHook: draft.scriptHook,
    skillTagsCsv: draft.tagsCsv,
    skillConditions: draft.conditions,
    skillEffects: draft.effects,
    imageVersion: String(piece?.imageVersion ?? 1),
    isActive: piece?.isActive ?? true,
    publishedAt: toDateTimeLocal(piece?.publishedAt ?? null),
    unpublishedAt: toDateTimeLocal(piece?.unpublishedAt ?? null),
    imageFile: null,
  };
}

function toEditFormState(detail: PieceDetailResponse): PieceFormState {
  const draft = buildSkillDraftFormValuesFromDefinition(detail.skillDefinition);

  return {
    pieceId: detail.piece.pieceId,
    kanji: detail.piece.kanji,
    name: detail.piece.name,
    rarity: detail.piece.rarity ?? "N",
    moveDescriptionJa: detail.piece.moveDescriptionJa ?? "",
    movePatternId: String(detail.piece.movePatternId),
    moveVectorsJson: "",
    moveCanJump: detail.movePattern?.canJump ?? false,
    specialMoveType: (() => {
      const ruleTypes = new Set(
        (detail.movePattern?.rules ?? []).map((rule) => rule.ruleType),
      );
      if (ruleTypes.has("immobile")) return "immobile";
      if (ruleTypes.has("turn_parity_override")) return "turn_parity_moon";
      if (ruleTypes.has("copy_front_enemy_move"))
        return "copy_front_enemy_move";
      if (ruleTypes.has("copy_last_enemy_move")) return "copy_last_enemy_move";
      return "none";
    })(),
    hasSkill: Boolean(detail.piece.skillId),
    skillMode: "existing",
    skillId: detail.piece.skillId ? String(detail.piece.skillId) : "",
    skillDesc: draft.skillDesc,
    implementationKind: draft.implementationKind,
    skillTriggerGroup: draft.triggerGroup,
    skillTriggerType: draft.triggerType,
    scriptHook: draft.scriptHook,
    skillTagsCsv: draft.tagsCsv,
    skillConditions: draft.conditions,
    skillEffects: draft.effects,
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
  formData.set("rarity", state.rarity);
  formData.set("moveDescriptionJa", state.moveDescriptionJa.trim());
  formData.set("movePatternId", state.movePatternId);
  formData.set("moveVectorsJson", state.moveVectorsJson);
  formData.set("moveCanJump", String(state.moveCanJump));
  formData.set("specialMoveType", state.specialMoveType);
  formData.set("hasSkill", String(state.hasSkill));
  formData.set("skillMode", state.skillMode);
  formData.set("skillId", state.skillId);
  formData.set("skillDesc", state.skillDesc.trim());
  formData.set("implementationKind", state.implementationKind.trim());
  formData.set("skillTriggerGroup", state.skillTriggerGroup.trim());
  formData.set("skillTriggerType", state.skillTriggerType.trim());
  formData.set("scriptHook", state.scriptHook.trim());
  formData.set("skillTagsCsv", state.skillTagsCsv.trim());
  formData.set("skillConditionsJson", JSON.stringify(state.skillConditions));
  formData.set("skillEffectsJson", JSON.stringify(state.skillEffects));
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

export function usePieceManagement() {
  const [pieces, setPieces] = useState<PieceRecord[]>([]);
  const [movePatterns, setMovePatterns] = useState<MovePatternOption[]>([]);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [skillRegistry, setSkillRegistry] =
    useState<SkillRegistryDocument>(emptySkillRegistry);
  const [selectedSkillDetail, setSelectedSkillDetail] =
    useState<SkillDefinitionRecord | null>(null);
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
    return toJson<PieceListResponse>(res);
  }, []);

  const fetchSkillDetail = useCallback(async (skillId: number) => {
    const res = await fetch(`/api/skills/${skillId}`, { cache: "no-store" });
    return toJson<SkillDefinitionRecord>(res);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchList(query);
      setPieces(data.pieces);
      setMovePatterns(data.movePatterns);
      setSkills(data.skills);
      setSkillRegistry(data.skillRegistry);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [fetchList, query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!form.hasSkill || form.skillMode !== "existing" || !form.skillId) {
      if (!form.hasSkill) {
        setSelectedSkillDetail(null);
      }
      return;
    }

    const skillId = Number(form.skillId);
    if (!Number.isInteger(skillId) || skillId <= 0) return;
    if (selectedSkillDetail?.skillId === skillId) return;

    void (async () => {
      try {
        const detail = await fetchSkillDetail(skillId);
        setSelectedSkillDetail(detail);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [
    fetchSkillDetail,
    form.hasSkill,
    form.skillId,
    form.skillMode,
    selectedSkillDetail?.skillId,
  ]);

  const isEditMode = useMemo(() => form.pieceId !== null, [form.pieceId]);

  const onChange = useCallback(
    (key: keyof PieceFormState, value: string | boolean | File | null) => {
      setForm((prev) => {
        if (key === "hasSkill") {
          const nextHasSkill = Boolean(value);
          if (!nextHasSkill) {
            return {
              ...prev,
              hasSkill: false,
              skillMode: "existing",
              skillId: "",
            };
          }
          return {
            ...prev,
            hasSkill: true,
          };
        }

        if (key === "skillMode") {
          return {
            ...prev,
            skillMode: value as SkillMode,
          };
        }

        if (key === "skillId") {
          return {
            ...prev,
            skillId: String(value ?? ""),
          };
        }

        return { ...prev, [key]: value };
      });
    },
    [],
  );

  const updateSkillDraftField = useCallback(
    (
      key:
        | "skillDesc"
        | "implementationKind"
        | "skillTriggerGroup"
        | "skillTriggerType"
        | "scriptHook"
        | "skillTagsCsv",
      value: string,
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const addSkillCondition = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      skillConditions: [
        ...prev.skillConditions,
        createEmptySkillDraftConditionFormState(),
      ],
    }));
  }, []);

  const updateSkillCondition = useCallback(
    (
      clientKey: string,
      key: keyof SkillDraftConditionFormState,
      value: string,
    ) => {
      setForm((prev) => ({
        ...prev,
        skillConditions: prev.skillConditions.map((condition) =>
          condition.clientKey === clientKey
            ? { ...condition, [key]: value }
            : condition,
        ),
      }));
    },
    [],
  );

  const removeSkillCondition = useCallback((clientKey: string) => {
    setForm((prev) => ({
      ...prev,
      skillConditions:
        prev.skillConditions.length > 1
          ? prev.skillConditions.filter(
              (condition) => condition.clientKey !== clientKey,
            )
          : [createEmptySkillDraftConditionFormState()],
    }));
  }, []);

  const addSkillEffect = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      skillEffects: [
        ...prev.skillEffects,
        createEmptySkillDraftEffectFormState(),
      ],
    }));
  }, []);

  const updateSkillEffect = useCallback(
    (
      clientKey: string,
      key: keyof SkillDraftEffectFormState,
      value: string,
    ) => {
      setForm((prev) => ({
        ...prev,
        skillEffects: prev.skillEffects.map((effect) =>
          effect.clientKey === clientKey ? { ...effect, [key]: value } : effect,
        ),
      }));
    },
    [],
  );

  const removeSkillEffect = useCallback((clientKey: string) => {
    setForm((prev) => ({
      ...prev,
      skillEffects:
        prev.skillEffects.length > 1
          ? prev.skillEffects.filter((effect) => effect.clientKey !== clientKey)
          : [createEmptySkillDraftEffectFormState()],
    }));
  }, []);

  const loadSelectedSkillAsDraft = useCallback(() => {
    if (!selectedSkillDetail || selectedSkillDetail.version !== "v2") return;
    const draft = buildSkillDraftFormValuesFromDefinition(selectedSkillDetail);
    setForm((prev) => ({
      ...prev,
      skillMode: "draft",
      skillDesc: draft.skillDesc,
      implementationKind: draft.implementationKind,
      skillTriggerGroup: draft.triggerGroup,
      skillTriggerType: draft.triggerType,
      scriptHook: draft.scriptHook,
      skillTagsCsv: draft.tagsCsv,
      skillConditions: draft.conditions,
      skillEffects: draft.effects,
    }));
  }, [selectedSkillDetail]);

  const resetForm = useCallback(() => {
    setForm(toFormState());
    setSelectedSkillDetail(null);
  }, []);

  const search = useCallback(async () => {
    const nextQuery = queryInput.trim();
    setQuery(nextQuery);
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchList(nextQuery);
      setPieces(data.pieces);
      setMovePatterns(data.movePatterns);
      setSkills(data.skills);
      setSkillRegistry(data.skillRegistry);
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
      setPieces(data.pieces);
      setMovePatterns(data.movePatterns);
      setSkills(data.skills);
      setSkillRegistry(data.skillRegistry);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [fetchList]);

  const startEdit = useCallback((piece: PieceRecord) => {
    setForm(toFormState(piece));
    setSelectedSkillDetail(null);
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
      setSelectedSkillDetail(detail.skillDefinition);
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
    skillRegistry,
    selectedSkillDetail,
    form,
    isEditMode,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    queryInput,
    query,
    onChange,
    updateSkillDraftField,
    addSkillCondition,
    updateSkillCondition,
    removeSkillCondition,
    addSkillEffect,
    updateSkillEffect,
    removeSkillEffect,
    loadSelectedSkillAsDraft,
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
