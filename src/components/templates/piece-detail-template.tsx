"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MovePatternVector,
  PieceRecord,
  SkillEffectRecord,
} from "@/api/model/piece";

type Props = {
  pieceId: number;
};

type PieceDetailData = {
  piece: PieceRecord;
  skillEffects: SkillEffectRecord[];
  moveVectors: MovePatternVector[];
  movePattern: {
    id: number;
    moveCode: string;
    moveName: string;
    isRepeatable: boolean;
    canJump: boolean;
    constraintsJson: Record<string, unknown> | null;
    rules: {
      ruleType: string;
      priority: number;
      paramsJson: Record<string, unknown> | null;
    }[];
  } | null;
  imageUrl: string | null;
};

const BOARD_SIZE = 9;
const CENTER = { row: 4, col: 4 };

function keyOf(row: number, col: number) {
  return `${row}:${col}`;
}

function buildMoveCells(vectors: MovePatternVector[]) {
  const cells = new Set<string>();
  for (const vector of vectors) {
    const stepLimit = Math.max(1, vector.maxStep);
    for (let step = 1; step <= stepLimit; step += 1) {
      const row = CENTER.row + vector.dy * step;
      const col = CENTER.col + vector.dx * step;
      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) break;
      cells.add(keyOf(row, col));
      if (vector.maxStep === 1) break;
    }
  }
  return cells;
}

function effectTypeLabel(value: string) {
  switch (value) {
    case "apply_status":
      return "状態付与";
    case "board_hazard":
      return "盤面ギミック";
    case "buff":
      return "強化";
    case "capture_constraint":
      return "捕獲制約";
    case "capture_with_leap":
      return "飛び越え捕獲";
    case "copy_ability":
      return "能力コピー";
    case "defense_or_immunity":
      return "防御・無効化";
    case "destroy_hand_piece":
      return "手駒破壊";
    case "disable_piece":
      return "駒無効化";
    case "extra_action":
      return "追加行動";
    case "forced_move":
      return "強制移動";
    case "gain_piece":
      return "駒獲得";
    case "inherit_ability":
      return "能力継承";
    case "linked_action":
      return "連動行動";
    case "modify_movement":
      return "移動変更";
    case "multi_capture":
      return "複数捕獲";
    case "reflective_movement":
      return "反射移動";
    case "remove_piece":
      return "駒除去";
    case "return_to_hand":
      return "手駒に戻す";
    case "revive":
      return "復活";
    case "seal_skill":
      return "スキル封印";
    case "send_to_hand":
      return "手駒送り";
    case "substitute":
      return "身代わり";
    case "summon_piece":
      return "駒召喚";
    case "transform_piece":
      return "駒変化";
    default:
      return "その他";
  }
}

function targetRuleLabel(value: string) {
  const adjacentMatch = value.match(/^adjacent_(\d+)$/);
  if (adjacentMatch) return `周囲${adjacentMatch[1]}マス`;
  switch (value) {
    case "self":
      return "自身";
    case "adjacent_area":
      return "隣接範囲";
    case "adjacent_8":
      return "周囲8マス";
    case "enemy_piece":
      return "敵駒";
    case "ally_piece":
      return "味方駒";
    case "board_cell":
      return "盤面マス";
    case "enemy_hand":
      return "敵の手駒";
    case "hand_piece":
      return "手駒";
    case "front_enemy":
      return "前方の敵";
    case "left_right":
      return "左右";
    case "same_row_or_col":
      return "同じ行または列";
    case "empty_cell":
      return "空きマス";
    case "all_enemy":
      return "敵全体";
    case "all_ally":
      return "味方全体";
    case "unspecified":
      return "未指定";
    default:
      return "その他";
  }
}

function triggerTimingLabel(value: string) {
  switch (value) {
    case "after_move":
      return "移動後";
    case "on_capture":
      return "捕獲時";
    case "on_capture_attempt":
      return "捕獲試行時";
    case "on_captured":
      return "捕獲された時";
    case "on_condition_met":
      return "条件達成時";
    case "on_move":
      return "移動時";
    case "on_other_piece_move":
      return "他駒移動時";
    case "on_turn_start":
      return "ターン開始時";
    case "on_turn_end":
      return "ターン終了時";
    case "passive":
      return "常時";
    default:
      return "その他";
  }
}

async function fetchPieceDetail(id: number): Promise<PieceDetailData> {
  const res = await fetch(`/api/pieces/${id}`, { cache: "no-store" });
  const json = (await res.json()) as {
    success: boolean;
    data?: PieceDetailData;
    error?: string;
  };
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "取得に失敗しました");
  }
  return json.data as PieceDetailData;
}

export function PieceDetailTemplate({ pieceId }: Props) {
  const [data, setData] = useState<PieceDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const moveCells = useMemo(
    () => (data ? buildMoveCells(data.moveVectors) : new Set<string>()),
    [data],
  );

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const detail = await fetchPieceDetail(pieceId);
        setData(detail);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [pieceId]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">駒詳細</h1>
        <div className="mt-4 flex gap-2">
          <Link
            href={{ pathname: "/pieces" }}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            一覧へ戻る
          </Link>
          <Link
            href={`/pieces/${pieceId}/edit`}
            className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            更新へ
          </Link>
        </div>
      </header>

      {isLoading ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          読み込み中...
        </section>
      ) : null}

      {error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {error}
        </section>
      ) : null}

      {data ? (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              基本情報
            </h2>
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div>駒ID: {data.piece.pieceId}</div>
              <div>駒コード: {data.piece.pieceCode}</div>
              <div>漢字: {data.piece.kanji}</div>
              <div>駒名: {data.piece.name}</div>
              <div>移動説明: {data.piece.moveDescriptionJa ?? "なし"}</div>
              <div>スキルID: {data.piece.skillId ?? "なし"}</div>
              <div>スキル説明: {data.piece.skillDesc ?? "なし"}</div>
              <div>有効: {data.piece.isActive ? "有効" : "無効"}</div>
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                駒画像
              </h3>
              {data.imageUrl ? (
                <img
                  src={data.imageUrl}
                  alt={`${data.piece.name}の画像`}
                  className="h-28 w-28 rounded-md border border-slate-200 object-cover"
                />
              ) : (
                <p className="text-sm text-slate-500">画像なし</p>
              )}
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">
                移動可能範囲
              </h3>
              <div className="inline-grid grid-cols-9 gap-1 rounded-md bg-slate-200 p-2">
                {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
                  const row = Math.floor(i / BOARD_SIZE);
                  const col = i % BOARD_SIZE;
                  const center = row === CENTER.row && col === CENTER.col;
                  const active = moveCells.has(keyOf(row, col));
                  const cellClass = center
                    ? "border-amber-700 bg-amber-300 text-amber-900"
                    : active
                      ? "border-blue-700 bg-blue-500 text-white"
                      : "border-slate-300 bg-white text-slate-700";
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`flex h-7 w-7 items-center justify-center rounded border text-[10px] font-bold ${cellClass}`}
                    >
                      {center ? "駒" : active ? "●" : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              スキル効果詳細
            </h2>
            {data.skillEffects.length === 0 ? (
              <p className="text-sm text-slate-500">スキル効果はありません。</p>
            ) : (
              <div className="space-y-3">
                {data.skillEffects.map((effect) => (
                  <div
                    key={effect.skillEffectId}
                    className="rounded-md border border-slate-200 p-3 text-sm"
                  >
                    <div>スキル説明: {data.piece.skillDesc ?? "なし"}</div>
                    <div>効果タイプ: {effectTypeLabel(effect.effectType)}</div>
                    <div>対象ルール: {targetRuleLabel(effect.targetRule)}</div>
                    <div>
                      発動タイミング: {triggerTimingLabel(effect.triggerTiming)}
                    </div>
                    <div>効果テキスト: {effect.valueText ?? "なし"}</div>
                    <div>効果数値: {effect.valueNum ?? "なし"}</div>
                    <div>発動確率: {effect.procChance ?? "なし"}</div>
                    <div>継続ターン: {effect.durationTurns ?? "なし"}</div>
                    <div>半径: {effect.radius ?? "なし"}</div>
                    <div>
                      追加パラメータ(JSON):{" "}
                      {effect.paramsJson
                        ? JSON.stringify(effect.paramsJson)
                        : "なし"}
                    </div>
                    <div className="text-xs text-slate-500">
                      効果順序: {effect.effectOrder}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
