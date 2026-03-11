"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SubmissionStatus } from "@/components/molecules/submission-status";
import { GachaForm } from "@/components/organisms/gacha-form";
import { GachaTable } from "@/components/organisms/gacha-table";
import { useGachaManagement } from "@/hooks/use-gacha-management";

type Props = {
  mode: "list" | "create" | "edit";
  gachaId?: number;
};

export function GachaManagementTemplate({ mode, gachaId }: Props) {
  const router = useRouter();
  const {
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
  } = useGachaManagement();

  useEffect(() => {
    if (mode === "edit" && gachaId) {
      void startEditById(gachaId);
    }
  }, [mode, gachaId, startEditById]);

  const isListMode = mode === "list";
  const isCreateMode = mode === "create";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {isListMode
            ? "ガチャ一覧"
            : isCreateMode
              ? "ガチャ作成"
              : "ガチャ更新"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isListMode
            ? "一覧から詳細確認・作成・更新を行えます。"
            : "内容を入力して保存してください。"}
        </p>
        {!isListMode ? (
          <div className="mt-4">
            <Link
              href={{ pathname: "/gachas" }}
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
          submittingText={
            isCreateMode ? "ガチャを作成中..." : "ガチャを更新中..."
          }
          completedText="完了"
          centered
        />
      ) : successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {!isListMode ? (
        <GachaForm
          form={form}
          pieceOptions={pieceOptions}
          selectionByPieceId={selectionByPieceId}
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
          onChange={onChange}
          onTogglePieceSelection={togglePieceSelection}
          onSetPieceWeight={setPieceWeight}
          onCancel={resetForm}
          onSubmit={() => {
            void submit();
          }}
        />
      ) : null}

      {isListMode ? (
        <GachaTable
          gachas={gachas}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          createHref="/gachas/new"
          queryInput={queryInput}
          onQueryInputChange={setQueryInput}
          onSearch={() => {
            void search();
          }}
          onResetSearch={() => {
            void resetSearch();
          }}
          onView={(gacha) => {
            router.push(`/gachas/${gacha.gachaId}` as never);
          }}
          onEdit={(gacha) => {
            router.push(`/gachas/${gacha.gachaId}/edit` as never);
          }}
        />
      ) : null}
    </main>
  );
}
