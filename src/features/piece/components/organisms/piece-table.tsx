"use client";

import { Button } from "@/features/piece/components/atoms/button";
import { PieceRecord } from "@/features/piece/domain/piece.types";

type Props = {
  pieces: PieceRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  onEdit: (piece: PieceRecord) => void;
  onDelete: (piece: PieceRecord) => void;
};

export function PieceTable({
  pieces,
  isLoading,
  isSubmitting,
  onEdit,
  onDelete,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">駒一覧</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">code</th>
              <th className="px-3 py-2">漢字</th>
              <th className="px-3 py-2">名前</th>
              <th className="px-3 py-2">移動</th>
              <th className="px-3 py-2">スキル</th>
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
              pieces.map((piece) => (
                <tr key={piece.pieceId} className="border-t border-slate-200">
                  <td className="px-3 py-2">{piece.pieceId}</td>
                  <td className="px-3 py-2">{piece.pieceCode}</td>
                  <td className="px-3 py-2">{piece.kanji}</td>
                  <td className="px-3 py-2">{piece.name}</td>
                  <td className="px-3 py-2">{piece.movePatternName ?? "-"}</td>
                  <td className="px-3 py-2">{piece.skillName ?? "-"}</td>
                  <td className="px-3 py-2">{piece.imageKey ? "あり" : "-"}</td>
                  <td className="px-3 py-2">{piece.isActive ? "ON" : "OFF"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
