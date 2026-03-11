"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  StagePlacementRecord,
  StageRecord,
} from "@/features/stage/domain/stage.types";

type Props = {
  stageId: number;
};

type StageDetailResponse = {
  stage: StageRecord;
  placements: StagePlacementRecord[];
};

const BOARD_SIZE = 9;

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

function toUiRow(placement: StagePlacementRecord) {
  if (
    placement.side === "enemy" &&
    placement.rowNo >= 0 &&
    placement.rowNo <= 2
  ) {
    return placement.rowNo + 6;
  }
  return placement.rowNo;
}

function keyOf(rowNo: number, colNo: number) {
  return `${rowNo}:${colNo}`;
}

async function toJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "取得に失敗しました");
  }
  return data;
}

export function StageDetailTemplate({ stageId }: Props) {
  const [data, setData] = useState<StageDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const placementMap = useMemo(() => {
    const map = new Map<string, StagePlacementRecord>();
    for (const placement of data?.placements ?? []) {
      const rowNo = toUiRow(placement);
      map.set(keyOf(rowNo, placement.colNo), placement);
    }
    return map;
  }, [data?.placements]);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stages/${stageId}`, {
          cache: "no-store",
        });
        const json = await toJson<StageDetailResponse>(res);
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [stageId]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">ステージ詳細</h1>
        <div className="mt-4 flex gap-2">
          <Link
            href={{ pathname: "/stages" }}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            一覧へ戻る
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
              <div>ステージID: {data.stage.stageId}</div>
              <div>ステージ番号: {data.stage.stageNo}</div>
              <div>名称: {data.stage.stageName}</div>
              <div>
                解放条件ステージ番号: {data.stage.unlockStageNo ?? "なし"}
              </div>
              <div>カテゴリ: {categoryLabel(data.stage.stageCategory)}</div>
              <div>
                クリア条件: {clearConditionLabel(data.stage.clearConditionType)}
              </div>
              <div>消費スタミナ: {data.stage.staminaCost}</div>
              <div>有効: {data.stage.isActive ? "有効" : "無効"}</div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              初期配置
            </h2>
            <div className="relative inline-grid grid-cols-9 gap-1 rounded-md bg-slate-200 p-2">
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
                const rowNo = Math.floor(i / BOARD_SIZE);
                const colNo = i % BOARD_SIZE;
                const isUserArea = rowNo >= 0 && rowNo <= 2;
                const isAiArea = rowNo >= 6 && rowNo <= 8;
                const placement = placementMap.get(keyOf(rowNo, colNo));
                const sideClass = placement
                  ? "border-red-500 bg-red-100 text-red-700"
                  : isAiArea
                    ? "border-emerald-400 bg-emerald-50 text-slate-700"
                    : isUserArea
                      ? "border-blue-300 bg-blue-50/80 text-slate-500"
                      : "border-slate-300 bg-white/70 text-slate-400";
                return (
                  <div
                    key={`${rowNo}-${colNo}`}
                    className={`flex aspect-square w-8 items-center justify-center rounded border text-xs font-bold ${sideClass}`}
                    title={`${rowNo},${colNo}`}
                  >
                    {placement?.pieceChar ?? ""}
                  </div>
                );
              })}
              <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded bg-emerald-600/85 px-2 py-0.5 text-[10px] font-semibold text-white">
                プレイヤー
              </div>
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-blue-600/85 px-2 py-0.5 text-[10px] font-semibold text-white">
                敵側
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm text-slate-600">
                配置数: {data.placements.length}
              </p>
              {data.placements.length === 0 ? (
                <p className="text-sm text-slate-500">初期配置はありません。</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-left">
                        <th className="px-3 py-2">側</th>
                        <th className="px-3 py-2">駒ID</th>
                        <th className="px-3 py-2">駒</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.placements.map((placement, index) => (
                        <tr
                          key={`${placement.side}-${placement.rowNo}-${placement.colNo}-${placement.pieceId}-${index}`}
                          className="border-t border-slate-200"
                        >
                          <td className="px-3 py-2">
                            {placement.side === "enemy" ? "敵" : "味方"}
                          </td>
                          <td className="px-3 py-2">{placement.pieceId}</td>
                          <td className="px-3 py-2">
                            {(placement.pieceChar ?? "-") +
                              " " +
                              (placement.pieceName ?? "-") +
                              " (" +
                              (placement.pieceCode ?? "-") +
                              ")"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
