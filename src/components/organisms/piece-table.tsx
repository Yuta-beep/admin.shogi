"use client";

import Link from "next/link";
import { Button } from "@/components/atoms/button";
import { PieceRecord } from "@/api/model/piece";
import {
  getRemainingSkillStatus,
  remainingSkillStatusClassName,
} from "@/utils/remaining-skill-status";

type Props = {
  pieces: PieceRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  createHref?: string;
  queryInput: string;
  onQueryInputChange: (value: string) => void;
  onSearch: () => void;
  onResetSearch: () => void;
  onView: (piece: PieceRecord) => void;
  onEdit: (piece: PieceRecord) => void;
  onDelete: (piece: PieceRecord) => void;
};

export function PieceTable({
  pieces,
  isLoading,
  isSubmitting,
  createHref,
  queryInput,
  onQueryInputChange,
  onSearch,
  onResetSearch,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">駒一覧</h2>
        <div className="flex items-center gap-2">
          <input
            value={queryInput}
            onChange={(event) => {
              onQueryInputChange(event.target.value);
            }}
            placeholder="漢字・スキル説明で検索"
            className="h-9 w-56 rounded-md border border-slate-300 px-3 text-sm outline-none ring-blue-500 focus:ring-2"
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
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">漢字</th>
              <th className="px-3 py-2">名前</th>
              <th className="px-3 py-2">レアリティ</th>
              <th className="px-3 py-2">スキル</th>
              <th className="px-3 py-2">残件状態</th>
              <th className="px-3 py-2">画像</th>
              <th className="px-3 py-2">有効</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  読み込み中...
                </td>
              </tr>
            ) : pieces.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  データがありません
                </td>
              </tr>
            ) : (
              pieces.map((piece) => {
                const remainingStatus = getRemainingSkillStatus(piece.skillId);
                return (
                  <tr key={piece.pieceId} className="border-t border-slate-200">
                    <td className="px-3 py-2">{piece.pieceId}</td>
                    <td className="px-3 py-2">{piece.kanji}</td>
                    <td className="px-3 py-2">{piece.name}</td>
                    <td className="px-3 py-2">{piece.rarity}</td>
                    <td className="px-3 py-2">{piece.skillDesc ?? "-"}</td>
                    <td className="px-3 py-2">
                      {remainingStatus ? (
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${remainingSkillStatusClassName(remainingStatus.state)}`}
                        >
                          {remainingStatus.label}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-3 py-2">{piece.imageKey ? "あり" : "-"}</td>
                    <td className="px-3 py-2">
                      {piece.isActive ? "有効" : "無効"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          variant="neutral"
                          onClick={() => onView(piece)}
                          disabled={isSubmitting}
                          className="h-8 px-3 text-xs"
                        >
                          詳細
                        </Button>
                        <Button
                          variant="neutral"
                          onClick={() => onEdit(piece)}
                          disabled={isSubmitting}
                          className="h-8 px-3 text-xs"
                        >
                          編集
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => onDelete(piece)}
                          disabled={isSubmitting}
                          className="h-8 px-3 text-xs"
                        >
                          削除
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
