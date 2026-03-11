"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GachaRecord, GachaTargetPieceRecord } from "@/api/model/gacha";

type Props = {
  gachaId: number;
};

type GachaDetailData = {
  gacha: GachaRecord;
  targetPieces: GachaTargetPieceRecord[];
};

async function fetchGachaDetail(id: number): Promise<GachaDetailData> {
  const res = await fetch(`/api/gachas/${id}`, { cache: "no-store" });
  const json = (await res.json()) as {
    success: boolean;
    data?: GachaDetailData;
    error?: string;
  };
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "取得に失敗しました");
  }
  return json.data as GachaDetailData;
}

export function GachaDetailTemplate({ gachaId }: Props) {
  const [data, setData] = useState<GachaDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const detail = await fetchGachaDetail(gachaId);
        setData(detail);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [gachaId]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">ガチャ詳細</h1>
        <div className="mt-4 flex gap-2">
          <Link
            href={{ pathname: "/gachas" }}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            一覧へ戻る
          </Link>
          <Link
            href={{ pathname: `/gachas/${gachaId}/edit` }}
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
              <div>ガチャID: {data.gacha.gachaId}</div>
              <div>ガチャコード: {data.gacha.gachaCode}</div>
              <div>ガチャ名: {data.gacha.gachaName}</div>
              <div>説明: {data.gacha.description ?? "なし"}</div>
              <div>歩コスト: {data.gacha.pawnCost}</div>
              <div>金コスト: {data.gacha.goldCost}</div>
              <div>画像ソース: {data.gacha.imageSource}</div>
              <div>画像バケット: {data.gacha.imageBucket ?? "なし"}</div>
              <div>画像キー: {data.gacha.imageKey ?? "なし"}</div>
              <div>画像バージョン: {data.gacha.imageVersion}</div>
              <div>有効: {data.gacha.isActive ? "有効" : "無効"}</div>
              <div>公開開始: {data.gacha.publishedAt ?? "未設定"}</div>
              <div>公開終了: {data.gacha.unpublishedAt ?? "未設定"}</div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              レア率
            </h2>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
              <div>N: {data.gacha.rarityRateN}</div>
              <div>R: {data.gacha.rarityRateR}</div>
              <div>SR: {data.gacha.rarityRateSr}</div>
              <div>UR: {data.gacha.rarityRateUr}</div>
              <div>SSR: {data.gacha.rarityRateSsr}</div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">
              対象駒
            </h2>
            {data.targetPieces.length === 0 ? (
              <p className="text-sm text-slate-500">対象駒はありません。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="px-3 py-2">駒ID</th>
                      <th className="px-3 py-2">駒</th>
                      <th className="px-3 py-2">名前</th>
                      <th className="px-3 py-2">レア</th>
                      <th className="px-3 py-2">重み</th>
                      <th className="px-3 py-2">有効</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.targetPieces.map((piece) => (
                      <tr
                        key={piece.pieceId}
                        className="border-t border-slate-200"
                      >
                        <td className="px-3 py-2">{piece.pieceId}</td>
                        <td className="px-3 py-2">{piece.char}</td>
                        <td className="px-3 py-2">{piece.name}</td>
                        <td className="px-3 py-2">{piece.rarity}</td>
                        <td className="px-3 py-2">{piece.weight}</td>
                        <td className="px-3 py-2">
                          {piece.isActive ? "有効" : "無効"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
