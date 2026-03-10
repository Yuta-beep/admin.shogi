"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MovePatternOption,
  PieceRecord,
  SkillOption,
} from "@/features/piece/domain/piece.types";

type PieceFormState = {
  pieceId: number | null;
  pieceCode: string;
  kanji: string;
  name: string;
  movePatternId: string;
  skillId: string;
  imageSource: "supabase" | "s3";
  imageVersion: string;
  isActive: boolean;
  publishedAt: string;
  unpublishedAt: string;
  imageFile: File | null;
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
    pieceCode: piece?.pieceCode ?? "",
    kanji: piece?.kanji ?? "",
    name: piece?.name ?? "",
    movePatternId: piece?.movePatternId ? String(piece.movePatternId) : "",
    skillId: piece?.skillId ? String(piece.skillId) : "",
    imageSource:
      (piece?.imageSource as "supabase" | "s3" | undefined) ?? "supabase",
    imageVersion: String(piece?.imageVersion ?? 1),
    isActive: piece?.isActive ?? true,
    publishedAt: toDateTimeLocal(piece?.publishedAt ?? null),
    unpublishedAt: toDateTimeLocal(piece?.unpublishedAt ?? null),
    imageFile: null,
  };
}

function buildFormData(state: PieceFormState) {
  const formData = new FormData();
  formData.set("pieceCode", state.pieceCode.trim());
  formData.set("kanji", state.kanji.trim());
  formData.set("name", state.name.trim());
  formData.set("movePatternId", state.movePatternId);
  formData.set("skillId", state.skillId);
  formData.set("imageSource", state.imageSource);
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
  const [form, setForm] = useState<PieceFormState>(toFormState());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/pieces", { cache: "no-store" });
      const json = await toJson<{
        pieces: PieceRecord[];
        movePatterns: MovePatternOption[];
        skills: SkillOption[];
      }>(res);

      setPieces(json.pieces);
      setMovePatterns(json.movePatterns);
      setSkills(json.skills);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const startEdit = useCallback((piece: PieceRecord) => {
    setForm(toFormState(piece));
    setSuccessMessage(null);
    setError(null);
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
    form,
    isEditMode,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    onChange,
    startEdit,
    resetForm,
    submit,
    remove,
  };
}
