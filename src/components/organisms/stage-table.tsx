"use client";

import Link from "next/link";
import { Button } from "@/components/atoms/button";
import { PieceOption, StageRecord } from "@/api/model/stage";

type Props = {
  stages: StageRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  createHref?: string;
  stageNameInput: string;
  selectedPieceIds: number[];
  pieceOptions: PieceOption[];
  onStageNameInputChange: (value: string) => void;
  onTogglePieceId: (pieceId: number) => void;
  onSearch: () => void;
  onResetSearch: () => void;
  onView: (stage: StageRecord) => void;
};

function categoryLabel(value: string) {
  switch (value) {
    case "normal":
      return "ノーマル";
    case "tutorial":
      return "チュートリアル";
    case "challenge":
      return "チャレンジ";
    case "event":
      return "イベント";
    default:
      return value;
  }
}

function clearConditionLabel(value: string) {
  switch (value) {
    case "defeat_boss":
      return "ボス撃破";
    case "defeat_all":
      return "全滅";
    case "survive_turns":
      return "規定ターン生存";
    case "reach_target":
      return "目標地点到達";
    default:
      return value;
  }
}

export function StageTable({
  stages,
  isLoading,
  isSubmitting,
  createHref,
  stageNameInput,
  selectedPieceIds,
  pieceOptions,
  onStageNameInputChange,
  onTogglePieceId,
  onSearch,
  onResetSearch,
  onView,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">ステージ一覧</h2>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <input
              value={stageNameInput}
              onChange={(event) => {
                onStageNameInputChange(event.target.value);
              }}
              placeholder="ステージ名で検索"
              className="h-9 w-52 rounded-md border border-slate-300 px-3 text-sm outline-none ring-blue-500 focus:ring-2"
            />
            <Button
              variant="neutral"
              onClick={onSearch}
              disabled={isLoading || isSubmitting}
              className="h-9 px-3 text-xs"
            >
              検索
            </Button>
            <Button
              variant="neutral"
              onClick={onResetSearch}
              disabled={isLoading || isSubmitting}
              className="h-9 px-3 text-xs"
            >
              リセット
            </Button>
            {createHref ? (
              <Link
                href={{ pathname: createHref }}
                className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                作成＋
              </Link>
            ) : null}
          </div>

          <div className="w-[560px] rounded-md border border-slate-200 bg-slate-50 p-2">
            <p className="mb-2 text-xs text-slate-600">
              使用駒で絞り込み（複数選択可）
            </p>
            <div className="grid max-h-28 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3">
              {pieceOptions.map((piece) => (
                <label
                  key={piece.pieceId}
                  className="flex items-center gap-2 text-xs text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedPieceIds.includes(piece.pieceId)}
                    onChange={() => {
                      onTogglePieceId(piece.pieceId);
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate">
                    {piece.char} {piece.name} (ID:{piece.pieceId})
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="px-3 py-2">ステージID</th>
              <th className="px-3 py-2">ステージ番号</th>
              <th className="px-3 py-2">名称</th>
              <th className="px-3 py-2">カテゴリ</th>
              <th className="px-3 py-2">条件</th>
              <th className="px-3 py-2">スタミナ</th>
              <th className="px-3 py-2">有効</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  読み込み中...
                </td>
              </tr>
            ) : stages.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  データがありません
                </td>
              </tr>
            ) : (
              stages.map((stage) => (
                <tr key={stage.stageId} className="border-t border-slate-200">
                  <td className="px-3 py-2">{stage.stageId}</td>
                  <td className="px-3 py-2">{stage.stageNo}</td>
                  <td className="px-3 py-2">{stage.stageName}</td>
                  <td className="px-3 py-2">
                    {categoryLabel(stage.stageCategory)}
                  </td>
                  <td className="px-3 py-2">
                    {clearConditionLabel(stage.clearConditionType)}
                  </td>
                  <td className="px-3 py-2">{stage.staminaCost}</td>
                  <td className="px-3 py-2">
                    {stage.isActive ? "有効" : "無効"}
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      variant="neutral"
                      onClick={() => onView(stage)}
                      disabled={isSubmitting}
                      className="h-8 px-3 text-xs"
                    >
                      詳細
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
