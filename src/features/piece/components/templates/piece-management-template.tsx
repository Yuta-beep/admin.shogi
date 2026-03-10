"use client";

import { PieceForm } from "@/features/piece/components/organisms/piece-form";
import { PieceTable } from "@/features/piece/components/organisms/piece-table";
import { usePieceManagement } from "@/features/piece/hooks/use-piece-management";

export function PieceManagementTemplate() {
  const {
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
  } = usePieceManagement();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">駒マスター管理</h1>
        <p className="mt-1 text-sm text-slate-600">
          作成・更新・削除と画像アップロードに対応しています。
        </p>
      </header>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <PieceForm
        form={form}
        movePatterns={movePatterns}
        skills={skills}
        isEditMode={isEditMode}
        isSubmitting={isSubmitting}
        onChange={onChange}
        onSubmit={() => {
          void submit();
        }}
        onCancel={resetForm}
      />

      <PieceTable
        pieces={pieces}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onEdit={startEdit}
        onDelete={(piece) => {
          const ok = window.confirm(`駒ID ${piece.pieceId} を削除しますか？`);
          if (!ok) return;
          void remove(piece.pieceId);
        }}
      />
    </main>
  );
}
