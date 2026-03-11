"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StageForm } from "@/features/stage/components/organisms/stage-form";
import { StageTable } from "@/features/stage/components/organisms/stage-table";
import { useStageManagement } from "@/features/stage/hooks/use-stage-management";
import { SubmissionStatus } from "@/shared/components/submission-status";

type Props = {
  mode: "list" | "create";
};

export function StageManagementTemplate({ mode }: Props) {
  const router = useRouter();
  const {
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
    onChange,
    setSearchStageNameInput,
    toggleSearchPieceId,
    search,
    resetSearch,
    setSelectedPieceId,
    setPlacementAt,
    clearPlacements,
    submit,
  } = useStageManagement();
  const isListMode = mode === "list";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {isListMode ? "ステージ一覧" : "ステージ作成"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isListMode
            ? "一覧から作成へ進めます。"
            : "内容を入力してステージを作成します。"}
        </p>
        {!isListMode ? (
          <div className="mt-4">
            <Link
              href={{ pathname: "/stages" }}
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
          submittingText="ステージを作成中..."
          completedText="完了"
          centered
        />
      ) : null}

      {!isListMode ? (
        <StageForm
          form={form}
          placements={placements}
          pieceOptions={pieceOptions}
          pieceById={pieceById}
          selectedPieceId={selectedPieceId}
          isSubmitting={isSubmitting}
          onChange={onChange}
          onSelectPieceId={setSelectedPieceId}
          onSetPlacement={setPlacementAt}
          onClearPlacements={clearPlacements}
          onSubmit={() => {
            void submit();
          }}
        />
      ) : null}

      {isListMode ? (
        <StageTable
          stages={stages}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          createHref="/stages/new"
          stageNameInput={searchStageNameInput}
          selectedPieceIds={searchPieceIdsInput}
          pieceOptions={pieceOptions}
          onStageNameInputChange={setSearchStageNameInput}
          onTogglePieceId={toggleSearchPieceId}
          onSearch={() => {
            void search();
          }}
          onResetSearch={() => {
            void resetSearch();
          }}
          onView={(stage) => {
            router.push(`/stages/${stage.stageId}` as never);
          }}
        />
      ) : null}
    </div>
  );
}
