"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { PieceForm } from "@/features/piece/components/organisms/piece-form";
import { PieceTable } from "@/features/piece/components/organisms/piece-table";
import { usePieceManagement } from "@/features/piece/hooks/use-piece-management";
import { SubmissionStatus } from "@/shared/components/submission-status";

type Props = {
  mode: "list" | "create" | "edit";
  pieceId?: number;
};

export function PieceManagementTemplate({ mode, pieceId }: Props) {
  const router = useRouter();
  const {
    pieces,
    movePatterns,
    skillDraftOptions,
    form,
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
    startEdit,
    startEditById,
    resetForm,
    submit,
    remove,
  } = usePieceManagement();
  const targetPiece = useMemo(
    () => (pieceId ? pieces.find((piece) => piece.pieceId === pieceId) : null),
    [pieceId, pieces],
  );

  useEffect(() => {
    if (mode === "edit" && pieceId) {
      void startEditById(pieceId);
      return;
    }
    if (mode === "edit" && targetPiece) {
      startEdit(targetPiece);
    }
  }, [mode, pieceId, startEditById, startEdit, targetPiece]);

  const isListMode = mode === "list";
  const isCreateMode = mode === "create";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {isListMode ? "駒一覧" : isCreateMode ? "駒作成" : "駒更新"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isListMode
            ? "一覧から詳細確認・作成・更新・削除を行えます。"
            : "内容を入力して保存してください。"}
        </p>
        {!isListMode ? (
          <div className="mt-4">
            <Link
              href={{ pathname: "/pieces" }}
              className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              一覧へ戻る
            </Link>
          </div>
        ) : null}
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!isListMode ? (
        <SubmissionStatus
          isSubmitting={isSubmitting}
          isCompleted={Boolean(successMessage)}
          submittingText={isCreateMode ? "駒を作成中..." : "駒を更新中..."}
          completedText="完了"
          centered
        />
      ) : successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {!isListMode ? (
        <PieceForm
          form={form}
          movePatterns={movePatterns}
          skillDraftOptions={skillDraftOptions}
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
          onChange={onChange}
          onSubmit={() => {
            void submit();
          }}
          onCancel={resetForm}
        />
      ) : null}

      {isListMode ? (
        <PieceTable
          pieces={pieces}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          createHref="/pieces/new"
          queryInput={queryInput}
          onQueryInputChange={setQueryInput}
          onSearch={() => {
            void search();
          }}
          onResetSearch={() => {
            void resetSearch();
          }}
          onView={(piece) => {
            router.push(`/pieces/${piece.pieceId}` as never);
          }}
          onEdit={(piece) => {
            router.push(`/pieces/${piece.pieceId}/edit` as never);
          }}
          onDelete={(piece) => {
            const ok = window.confirm(`駒ID ${piece.pieceId} を削除しますか？`);
            if (!ok) return;
            void remove(piece.pieceId);
          }}
        />
      ) : null}
    </main>
  );
}
