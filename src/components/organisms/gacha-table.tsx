"use client";

import Link from "next/link";
import { Button } from "@/components/atoms/button";
import { GachaRecord } from "@/api/model/gacha";

type GachaListItem = GachaRecord & {
  pieceCount: number;
};

type Props = {
  gachas: GachaListItem[];
  isLoading: boolean;
  isSubmitting: boolean;
  createHref?: string;
  queryInput: string;
  onQueryInputChange: (value: string) => void;
  onSearch: () => void;
  onResetSearch: () => void;
  onView: (gacha: GachaListItem) => void;
  onEdit: (gacha: GachaListItem) => void;
};

export function GachaTable({
  gachas,
  isLoading,
  isSubmitting,
  createHref,
  queryInput,
  onQueryInputChange,
  onSearch,
  onResetSearch,
  onView,
  onEdit,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">ガチャ一覧</h2>
        <div className="flex items-center gap-2">
          <input
            value={queryInput}
            onChange={(event) => onQueryInputChange(event.target.value)}
            placeholder="コード・名前で検索"
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
              <th className="px-3 py-2">コード</th>
              <th className="px-3 py-2">名前</th>
              <th className="px-3 py-2">コスト</th>
              <th className="px-3 py-2">対象駒数</th>
              <th className="px-3 py-2">有効</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  読み込み中...
                </td>
              </tr>
            ) : gachas.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  データがありません
                </td>
              </tr>
            ) : (
              gachas.map((gacha) => (
                <tr key={gacha.gachaId} className="border-t border-slate-200">
                  <td className="px-3 py-2">{gacha.gachaId}</td>
                  <td className="px-3 py-2">{gacha.gachaCode}</td>
                  <td className="px-3 py-2">{gacha.gachaName}</td>
                  <td className="px-3 py-2">
                    歩 {gacha.pawnCost} / 金 {gacha.goldCost}
                  </td>
                  <td className="px-3 py-2">{gacha.pieceCount}</td>
                  <td className="px-3 py-2">
                    {gacha.isActive ? "有効" : "無効"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button
                        variant="neutral"
                        onClick={() => onView(gacha)}
                        disabled={isSubmitting}
                        className="h-8 px-3 text-xs"
                      >
                        詳細
                      </Button>
                      <Button
                        variant="neutral"
                        onClick={() => onEdit(gacha)}
                        disabled={isSubmitting}
                        className="h-8 px-3 text-xs"
                      >
                        編集
                      </Button>
                    </div>
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
