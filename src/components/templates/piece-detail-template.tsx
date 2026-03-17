"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MovePatternVector,
  PieceRecord,
  SkillDefinitionRecord,
} from "@/api/model/piece";
import {
  getRemainingSkillStatus,
  remainingSkillStatusClassName,
} from "@/utils/remaining-skill-status";

type Props = {
  pieceId: number;
};

type PieceDetailData = {
  piece: PieceRecord;
  skillDefinition: SkillDefinitionRecord | null;
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

function SkillDefinitionPanel({
  definition,
}: {
  definition: SkillDefinitionRecord | null;
}) {
  if (!definition) {
    return <p className="text-sm text-slate-500">スキル定義はありません。</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div>version: {definition.version}</div>
        <div>
          implementation_kind: {definition.implementationKind ?? "legacy/null"}
        </div>
        <div>
          trigger: {definition.trigger.group ?? "-"} /{" "}
          {definition.trigger.type ?? "-"}
        </div>
        <div>script_hook: {definition.scriptHook ?? "-"}</div>
        <div>
          tags: {definition.tags.length > 0 ? definition.tags.join(", ") : "-"}
        </div>
      </div>

      {definition.version === "v2" ? (
        <>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Conditions
            </h3>
            {definition.conditions.length === 0 ? (
              <p className="text-xs text-slate-500">条件なし</p>
            ) : (
              <div className="space-y-2">
                {definition.conditions.map((condition) => (
                  <div
                    key={`condition-${condition.skillConditionId ?? condition.order}`}
                    className="rounded border border-slate-200 p-2"
                  >
                    <div>
                      #{condition.order} {condition.group} / {condition.type}
                    </div>
                    <pre className="mt-1 overflow-x-auto rounded bg-slate-100 p-2 text-xs">
                      {JSON.stringify(condition.paramsJson ?? {}, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Effects
            </h3>
            {definition.effects.length === 0 ? (
              <p className="text-xs text-slate-500">effect なし</p>
            ) : (
              <div className="space-y-2">
                {definition.effects.map((effect) => (
                  <div
                    key={`effect-${effect.skillEffectId ?? effect.effectOrder}`}
                    className="rounded border border-slate-200 p-2"
                  >
                    <div>
                      #{effect.effectOrder} {effect.effectGroup} /{" "}
                      {effect.effectType}
                    </div>
                    <div>
                      target: {effect.targetGroup} / {effect.targetSelector}
                    </div>
                    <pre className="mt-1 overflow-x-auto rounded bg-slate-100 p-2 text-xs">
                      {JSON.stringify(effect.paramsJson ?? {}, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">
            Legacy Effects
          </h3>
          {definition.legacyEffects.length === 0 ? (
            <p className="text-xs text-slate-500">legacy effect なし</p>
          ) : (
            <div className="space-y-2">
              {definition.legacyEffects.map((effect) => (
                <div
                  key={`legacy-${effect.skillEffectId}`}
                  className="rounded border border-slate-200 p-2"
                >
                  <div>
                    #{effect.effectOrder} {effect.effectType}
                  </div>
                  <div>target_rule: {effect.targetRule}</div>
                  <div>trigger_timing: {effect.triggerTiming ?? "-"}</div>
                  <pre className="mt-1 overflow-x-auto rounded bg-slate-100 p-2 text-xs">
                    {JSON.stringify(effect.paramsJson ?? {}, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
          {(() => {
            const remainingStatus = getRemainingSkillStatus(data.piece.skillId);
            return remainingStatus ? (
              <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">
                  残り 10 件の判定状態
                </h2>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${remainingSkillStatusClassName(remainingStatus.state)}`}
                >
                  {remainingStatus.label}
                </span>
              </section>
            ) : null;
          })()}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              基本情報
            </h2>
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div>駒ID: {data.piece.pieceId}</div>
              <div>駒コード: {data.piece.pieceCode}</div>
              <div>漢字: {data.piece.kanji}</div>
              <div>駒名: {data.piece.name}</div>
              <div>レアリティ: {data.piece.rarity}</div>
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
                <Image
                  src={data.imageUrl}
                  alt={`${data.piece.name}の画像`}
                  width={112}
                  height={112}
                  unoptimized
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
              スキル定義詳細
            </h2>
            <SkillDefinitionPanel definition={data.skillDefinition} />
          </section>
        </>
      ) : null}
    </main>
  );
}
