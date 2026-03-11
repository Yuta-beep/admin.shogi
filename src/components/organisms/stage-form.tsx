"use client";

import { Button } from "@/components/atoms/button";
import { CheckboxInput } from "@/components/atoms/checkbox-input";
import { SelectInput } from "@/components/atoms/select-input";
import { TextInput } from "@/components/atoms/text-input";
import { FormField } from "@/components/molecules/form-field";
import { PieceOption, RewardOption } from "@/api/model/stage";
import { StagePlacementInput } from "@/types/stage";

type FormState = {
  stageNo: string;
  stageName: string;
  unlockStageNo: string;
  stageCategory: string;
  clearConditionType: string;
  staminaCost: string;
  isActive: boolean;
  publishedAt: string;
  unpublishedAt: string;
};

type Props = {
  form: FormState;
  placements: StagePlacementInput[];
  rewards: {
    rewardId: string;
    rewardTiming: "first_clear" | "clear";
    quantity: string;
  }[];
  pieceOptions: PieceOption[];
  rewardOptions: RewardOption[];
  pieceById: Record<number, PieceOption>;
  selectedPieceId: number | null;
  isSubmitting: boolean;
  onChange: (key: keyof FormState, value: string | boolean) => void;
  onSelectPieceId: (pieceId: number | null) => void;
  onSetPlacement: (rowNo: number, colNo: number) => void;
  onClearPlacements: () => void;
  onAddReward: () => void;
  onRemoveReward: (index: number) => void;
  onChangeReward: (
    index: number,
    key: "rewardId" | "rewardTiming" | "quantity",
    value: string,
  ) => void;
  onSubmit: () => void;
};

const BOARD_ROWS = 9;
const BOARD_COLS = 9;
const USER_ROW_MIN = 0;
const USER_ROW_MAX = 2;
const AI_ROW_MIN = 6;
const AI_ROW_MAX = 8;

export function StageForm({
  form,
  placements,
  rewards,
  pieceOptions,
  rewardOptions,
  pieceById,
  selectedPieceId,
  isSubmitting,
  onChange,
  onSelectPieceId,
  onSetPlacement,
  onClearPlacements,
  onAddReward,
  onRemoveReward,
  onChangeReward,
  onSubmit,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        ステージ作成
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="ステージ番号" required>
          <TextInput
            type="number"
            min={1}
            value={form.stageNo}
            onChange={(e) => onChange("stageNo", e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="ステージ名" required>
          <TextInput
            value={form.stageName}
            onChange={(e) => onChange("stageName", e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="解放条件ステージ番号">
          <TextInput
            type="number"
            min={1}
            value={form.unlockStageNo}
            onChange={(e) => onChange("unlockStageNo", e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="カテゴリ">
          <SelectInput
            value={form.stageCategory}
            onChange={(e) => onChange("stageCategory", e.target.value)}
            disabled={isSubmitting}
          >
            <option value="normal">ノーマル</option>
            <option value="tutorial">チュートリアル</option>
            <option value="challenge">チャレンジ</option>
            <option value="event">イベント</option>
          </SelectInput>
        </FormField>

        <FormField label="クリア条件タイプ">
          <SelectInput
            value={form.clearConditionType}
            onChange={(e) => onChange("clearConditionType", e.target.value)}
            disabled={isSubmitting}
          >
            <option value="defeat_boss">ボス撃破</option>
            <option value="defeat_all">全滅</option>
            <option value="survive_turns">規定ターン生存</option>
            <option value="reach_target">目標地点到達</option>
          </SelectInput>
        </FormField>

        <FormField label="消費スタミナ">
          <TextInput
            type="number"
            min={0}
            value={form.staminaCost}
            onChange={(e) => onChange("staminaCost", e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="公開開始日時">
          <TextInput
            type="datetime-local"
            value={form.publishedAt}
            onChange={(e) => onChange("publishedAt", e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="公開終了日時">
          <TextInput
            type="datetime-local"
            value={form.unpublishedAt}
            onChange={(e) => onChange("unpublishedAt", e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <div className="flex items-center gap-2 pt-7">
          <CheckboxInput
            checked={form.isActive}
            onChange={(e) => onChange("isActive", e.target.checked)}
            disabled={isSubmitting}
          />
          <span className="text-sm text-slate-700">有効</span>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          初期配置（9x9）
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          敵側エリア（下3段）のみ配置可能です。駒を選択してセルを押すと配置、駒未選択で押すとそのセルはクリアされます。
        </p>

        <div className="mb-3 grid grid-cols-1 gap-3">
          <FormField label="配置する駒">
            <SelectInput
              value={selectedPieceId ? String(selectedPieceId) : ""}
              onChange={(e) =>
                onSelectPieceId(e.target.value ? Number(e.target.value) : null)
              }
              disabled={isSubmitting}
            >
              <option value="">未選択（クリックで削除）</option>
              {pieceOptions.map((piece) => (
                <option key={piece.pieceId} value={piece.pieceId}>
                  {piece.char} {piece.name} ({piece.pieceCode})
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>

        <div className="relative grid w-fit grid-cols-9 gap-1 rounded-md bg-slate-200 p-2">
          {Array.from({ length: BOARD_ROWS * BOARD_COLS }, (_, i) => {
            const rowNo = Math.floor(i / BOARD_COLS);
            const colNo = i % BOARD_COLS;
            const isUserArea = rowNo >= USER_ROW_MIN && rowNo <= USER_ROW_MAX;
            const isAiArea = rowNo >= AI_ROW_MIN && rowNo <= AI_ROW_MAX;
            const placement = placements.find(
              (p) => p.rowNo === rowNo && p.colNo === colNo,
            );
            const piece = placement ? pieceById[placement.pieceId] : null;
            const sideClass = placement
              ? "border-red-500 bg-red-100 text-red-700"
              : isAiArea
                ? "border-emerald-400 bg-emerald-50 text-slate-700 hover:bg-emerald-100"
                : isUserArea
                  ? "border-blue-300 bg-blue-50/80 text-slate-500"
                  : "border-slate-300 bg-white/70 text-slate-400";

            return (
              <button
                key={`${rowNo}-${colNo}`}
                type="button"
                onClick={() => onSetPlacement(rowNo, colNo)}
                className={`aspect-square w-8 rounded border text-xs font-bold ${sideClass}`}
                disabled={isSubmitting || !isAiArea}
                title={`${rowNo},${colNo}`}
              >
                {piece ? piece.char : ""}
              </button>
            );
          })}
          <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded bg-emerald-600/85 px-2 py-0.5 text-[10px] font-semibold text-white">
            プレイヤー
          </div>
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-blue-600/85 px-2 py-0.5 text-[10px] font-semibold text-white">
            敵側
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span>配置数: {placements.length}</span>
          <Button
            variant="neutral"
            className="h-8 px-3 text-xs"
            onClick={onClearPlacements}
            disabled={isSubmitting || placements.length === 0}
          >
            配置クリア
          </Button>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">報酬設定</h3>
          <Button
            variant="neutral"
            className="h-8 px-3 text-xs"
            onClick={onAddReward}
            disabled={isSubmitting}
          >
            報酬を追加
          </Button>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          クリア報酬（初回 / 2回目以降）を設定できます。
        </p>

        {rewards.length === 0 ? (
          <p className="text-sm text-slate-500">報酬が未設定です。</p>
        ) : (
          <div className="space-y-2">
            {rewards.map((reward, index) => (
              <div
                key={`reward-${index}`}
                className="grid grid-cols-1 gap-2 rounded border border-slate-200 p-2 md:grid-cols-[160px_1fr_120px_110px]"
              >
                <SelectInput
                  value={reward.rewardTiming}
                  onChange={(e) =>
                    onChangeReward(index, "rewardTiming", e.target.value)
                  }
                  disabled={isSubmitting}
                >
                  <option value="first_clear">初回クリア</option>
                  <option value="clear">2回目以降</option>
                </SelectInput>

                <SelectInput
                  value={reward.rewardId}
                  onChange={(e) =>
                    onChangeReward(index, "rewardId", e.target.value)
                  }
                  disabled={isSubmitting}
                >
                  <option value="">報酬を選択</option>
                  {rewardOptions.map((option) => (
                    <option key={option.rewardId} value={option.rewardId}>
                      {option.rewardType === "currency" ? "通貨" : "駒"}:{" "}
                      {option.rewardName}
                    </option>
                  ))}
                </SelectInput>

                <TextInput
                  type="number"
                  min={1}
                  value={reward.quantity}
                  onChange={(e) =>
                    onChangeReward(index, "quantity", e.target.value)
                  }
                  disabled={isSubmitting}
                />

                <Button
                  variant="danger"
                  className="h-10"
                  onClick={() => onRemoveReward(index)}
                  disabled={isSubmitting}
                >
                  削除
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button onClick={onSubmit} disabled={isSubmitting}>
          作成
        </Button>
      </div>
    </section>
  );
}
