"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/atoms/button";
import { CheckboxInput } from "@/components/atoms/checkbox-input";
import { MovePatternVector } from "@/api/model/piece";
import { vectorsFromBoardSelection } from "@/utils/move-pattern-matcher";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (vectors: MovePatternVector[]) => void;
};

const BOARD_SIZE = 9;
const CENTER = { row: 4, col: 4 };

function keyOf(row: number, col: number) {
  return `${row}:${col}`;
}

export function MoveRangePickerModal({ isOpen, onClose, onApply }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [repeatable, setRepeatable] = useState(false);

  const selectedCount = selected.size;

  const selectedCells = useMemo(
    () =>
      Array.from(selected.values()).map((key) => {
        const [row, col] = key.split(":").map(Number);
        return { row, col };
      }),
    [selected],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            移動範囲を選択
          </h3>
          <Button
            variant="neutral"
            onClick={onClose}
            className="h-8 px-3 text-xs"
          >
            閉じる
          </Button>
        </div>

        <p className="mb-3 text-sm text-slate-600">
          盤面中央の駒から移動できるマスをクリックしてください。
        </p>

        <div className="mb-3 flex items-center gap-2">
          <CheckboxInput
            checked={repeatable}
            onChange={(e) => setRepeatable(e.target.checked)}
          />
          <span className="text-sm text-slate-700">
            反復移動として扱う（香/角/飛のような滑走）
          </span>
        </div>

        <div className="grid grid-cols-9 gap-1 rounded-md bg-slate-200 p-2">
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
            const row = Math.floor(i / BOARD_SIZE);
            const col = i % BOARD_SIZE;
            const center = row === CENTER.row && col === CENTER.col;
            const key = keyOf(row, col);
            const active = selected.has(key);

            return (
              <button
                key={key}
                type="button"
                disabled={center}
                onClick={() => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) {
                      next.delete(key);
                    } else {
                      next.add(key);
                    }
                    return next;
                  });
                }}
                className={`aspect-square rounded border text-xs font-bold ${center ? "border-amber-700 bg-amber-300 text-amber-900" : active ? "border-blue-700 bg-blue-500 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
              >
                {center ? "駒" : active ? "●" : ""}
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-xs text-slate-500">
          選択中: {selectedCount} マス
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              const vectors = vectorsFromBoardSelection(
                selectedCells,
                repeatable,
              );
              onApply(vectors);
            }}
            disabled={selectedCount === 0}
          >
            この移動範囲を適用
          </Button>
          <Button
            variant="neutral"
            onClick={() => setSelected(new Set())}
            disabled={selectedCount === 0}
          >
            選択クリア
          </Button>
        </div>
      </div>
    </div>
  );
}
