"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { CheckboxInput } from "@/components/atoms/checkbox-input";
import { FileInput } from "@/components/atoms/file-input";
import { SelectInput } from "@/components/atoms/select-input";
import { TextInput } from "@/components/atoms/text-input";
import { FormField } from "@/components/molecules/form-field";
import { MoveRangePickerModal } from "@/components/organisms/move-range-picker-modal";
import {
  MovePatternOption,
  MovePatternVector,
  SkillDraftOptions,
} from "@/api/model/piece";

type FormState = {
  pieceId: number | null;
  kanji: string;
  name: string;
  moveDescriptionJa: string;
  movePatternId: string;
  moveVectorsJson: string;
  moveCanJump: boolean;
  specialMoveType:
    | "none"
    | "immobile"
    | "turn_parity_moon"
    | "copy_front_enemy_move"
    | "copy_last_enemy_move";
  hasSkill: boolean;
  skillId: string;
  skillDesc: string;
  skillEffectType: string;
  skillTargetRule: string;
  skillTargetAdjacentN: string;
  skillTriggerTiming: string;
  skillValueText: string;
  skillValueNum: string;
  skillProcChance: string;
  skillDurationTurns: string;
  skillRadius: string;
  skillParamsJson: string;
  imageVersion: string;
  isActive: boolean;
  publishedAt: string;
  unpublishedAt: string;
  imageFile: File | null;
};

type Props = {
  form: FormState;
  movePatterns: MovePatternOption[];
  skillDraftOptions: SkillDraftOptions;
  isEditMode: boolean;
  isSubmitting: boolean;
  onChange: (
    key: keyof FormState,
    value: string | boolean | File | null,
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

function effectTypeLabel(value: string) {
  switch (value) {
    case "apply_status":
      return "状態付与";
    case "board_hazard":
      return "盤面ギミック";
    case "forced_move":
      return "強制移動";
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
    case "heal":
      return "回復";
    case "buff":
      return "強化";
    case "debuff":
      return "弱体化";
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
    case "passive":
      return "常時";
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
    default:
      return "その他";
  }
}

function targetRuleLabel(value: string) {
  const adjacentMatch = value.match(/^adjacent_(\d+)$/);
  if (adjacentMatch) {
    return `周囲${adjacentMatch[1]}マス`;
  }
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

function detectCanJumpFromVectors(vectors: MovePatternVector[]) {
  const hasOneStepDirection = new Set<string>();
  for (const v of vectors) {
    if (Math.max(Math.abs(v.dx), Math.abs(v.dy)) === 1) {
      hasOneStepDirection.add(`${Math.sign(v.dx)}:${Math.sign(v.dy)}`);
    }
  }
  return vectors.some((v) => {
    const dx = Math.abs(v.dx);
    const dy = Math.abs(v.dy);
    const distance = Math.max(dx, dy);
    if (distance <= 1) return false;
    const stepX = Math.sign(v.dx);
    const stepY = Math.sign(v.dy);
    const key = `${stepX}:${stepY}`;
    if (!hasOneStepDirection.has(key)) return true;
    return false;
  });
}

export function PieceForm({
  form,
  movePatterns,
  skillDraftOptions,
  isEditMode,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [rangeHint, setRangeHint] = useState<string | null>(null);
  const selectedMovePattern = movePatterns.find(
    (pattern) => String(pattern.id) === form.movePatternId,
  );
  const targetRuleOptions = (() => {
    const base = skillDraftOptions.targetRules
      .filter((value) => !/^adjacent_\d+$/.test(value))
      .map((value) => ({
        value,
        label: targetRuleLabel(value),
      }));

    return [
      ...base,
      { value: "__adjacent_custom__", label: "周囲nマス（入力）" },
    ];
  })();
  const selectedMoveVectors = (() => {
    if (!form.moveVectorsJson) return [] as MovePatternVector[];
    try {
      const parsed = JSON.parse(form.moveVectorsJson);
      return Array.isArray(parsed) ? (parsed as MovePatternVector[]) : [];
    } catch {
      return [] as MovePatternVector[];
    }
  })();

  function applySelectedRange(vectors: MovePatternVector[]) {
    onChange("movePatternId", "");
    onChange("moveVectorsJson", JSON.stringify(vectors));
    onChange("moveCanJump", detectCanJumpFromVectors(vectors));
    setRangeHint(
      `盤面で選択した移動範囲を適用しました（${vectors.length}ベクトル）。保存時に新規移動パターンを作成します。`,
    );
    setIsRangePickerOpen(false);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          {isEditMode ? "駒更新" : "駒作成"}
        </h2>
        {isEditMode ? (
          <Button variant="neutral" onClick={onCancel} disabled={isSubmitting}>
            キャンセル
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="漢字" required>
          <TextInput
            value={form.kanji}
            onChange={(e) => onChange("kanji", e.target.value)}
            placeholder="例: 歩"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="駒名" required>
          <TextInput
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="例: 歩兵"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="移動説明（任意）">
          <TextInput
            value={form.moveDescriptionJa}
            onChange={(e) => onChange("moveDescriptionJa", e.target.value)}
            placeholder="例: 前方に1マス移動できる。"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="駒移動範囲" required>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="neutral"
                className="h-9 px-3 text-xs"
                onClick={() => setIsRangePickerOpen(true)}
                disabled={isSubmitting}
              >
                盤面で移動範囲を選択
              </Button>
              {rangeHint ? (
                <span className="text-xs text-slate-600">{rangeHint}</span>
              ) : null}
            </div>
            <div className="text-xs text-slate-600">
              {selectedMoveVectors.length > 0
                ? `盤面選択済み: ${selectedMoveVectors.length} ベクトル（保存時に新規作成）`
                : selectedMovePattern
                  ? `選択中: ${selectedMovePattern.moveName} (${selectedMovePattern.moveCode})`
                  : "まだ選択されていません。盤面から移動範囲を選択してください。"}
            </div>
          </div>
        </FormField>

        <div className="md:col-span-2 rounded-md border border-slate-200 p-3">
          <div className="mb-2 text-sm font-semibold text-slate-800">
            特殊移動（任意）
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Can Jump">
              <div className="flex items-center gap-2">
                <CheckboxInput
                  checked={form.moveCanJump}
                  onChange={(e) => onChange("moveCanJump", e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="text-sm text-slate-700">駒を飛び越え可能</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                盤面で移動範囲を選ぶと自動判定でONになります（手動変更も可）。
              </p>
            </FormField>

            <FormField label="特殊移動タイプ">
              <SelectInput
                value={form.specialMoveType}
                onChange={(e) => onChange("specialMoveType", e.target.value)}
                disabled={isSubmitting}
              >
                <option value="none">なし</option>
                <option value="immobile">移動不可（immobile）</option>
                <option value="turn_parity_moon">
                  月タイプ（奇偶ターンで移動変更）
                </option>
                <option value="copy_front_enemy_move">
                  正面敵の動きをコピー
                </option>
                <option value="copy_last_enemy_move">直前敵手をコピー</option>
              </SelectInput>
            </FormField>
          </div>
        </div>

        <div className="md:col-span-2 rounded-md border border-slate-200 p-3">
          <div className="mb-2 text-sm font-semibold text-slate-800">
            スキル設定
          </div>
          <div className="mb-3 flex items-center gap-2">
            <CheckboxInput
              checked={form.hasSkill}
              onChange={(e) => onChange("hasSkill", e.target.checked)}
              disabled={isSubmitting}
            />
            <span className="text-sm text-slate-700">スキルあり</span>
          </div>

          {form.hasSkill ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormField label="スキル説明" required>
                <TextInput
                  value={form.skillDesc}
                  onChange={(e) => onChange("skillDesc", e.target.value)}
                  placeholder="例: 周囲の敵を1マス押し出す"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="効果タイプ" required>
                <SelectInput
                  value={form.skillEffectType}
                  onChange={(e) => onChange("skillEffectType", e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">選択してください</option>
                  {skillDraftOptions.effectTypes.map((value) => (
                    <option key={value} value={value}>
                      {effectTypeLabel(value)}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label="対象ルール" required>
                <div className="flex flex-col gap-2">
                  <SelectInput
                    value={form.skillTargetRule}
                    onChange={(e) =>
                      onChange("skillTargetRule", e.target.value)
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">選択してください</option>
                    {targetRuleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                  {form.skillTargetRule === "__adjacent_custom__" ? (
                    <TextInput
                      type="number"
                      min={1}
                      value={form.skillTargetAdjacentN}
                      onChange={(e) =>
                        onChange("skillTargetAdjacentN", e.target.value)
                      }
                      placeholder="例: 2（adjacent_2）"
                      disabled={isSubmitting}
                    />
                  ) : null}
                </div>
              </FormField>

              <FormField label="発動タイミング" required>
                <SelectInput
                  value={form.skillTriggerTiming}
                  onChange={(e) =>
                    onChange("skillTriggerTiming", e.target.value)
                  }
                  disabled={isSubmitting}
                >
                  <option value="">選択してください</option>
                  {skillDraftOptions.triggerTimings.map((value) => (
                    <option key={value} value={value}>
                      {triggerTimingLabel(value)}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label="効果テキスト" required>
                <TextInput
                  value={form.skillValueText}
                  onChange={(e) => onChange("skillValueText", e.target.value)}
                  placeholder="例: 敵駒を1マス移動させる"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="効果数値" required>
                <TextInput
                  type="number"
                  value={form.skillValueNum}
                  onChange={(e) => onChange("skillValueNum", e.target.value)}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="発動確率" required>
                <TextInput
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  value={form.skillProcChance}
                  onChange={(e) => onChange("skillProcChance", e.target.value)}
                  placeholder="例: 0.3"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="継続ターン" required>
                <TextInput
                  type="number"
                  min={1}
                  value={form.skillDurationTurns}
                  onChange={(e) =>
                    onChange("skillDurationTurns", e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="半径" required>
                <div className="flex flex-col gap-1">
                  <TextInput
                    type="number"
                    min={0}
                    value={form.skillRadius}
                    onChange={(e) => onChange("skillRadius", e.target.value)}
                    placeholder="例: 1（周囲1マス）"
                    disabled={isSubmitting}
                  />
                  <span className="text-xs text-slate-500">
                    0=自身のみ、1=周囲1マス、2=周囲2マス
                  </span>
                </div>
              </FormField>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              スキルを使う場合は「スキルあり」にチェックしてください。
            </p>
          )}
        </div>

        <FormField label="画像バージョン" required>
          <TextInput
            type="number"
            min={1}
            value={form.imageVersion}
            onChange={(e) => onChange("imageVersion", e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="画像アップロード">
          <div className="flex flex-col gap-1">
            <FileInput
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) =>
                onChange("imageFile", e.target.files?.[0] ?? null)
              }
              disabled={isSubmitting}
            />
            <span className="text-xs text-slate-500">
              新規アップロードは縦横比1:1の画像のみ対応です。既存の画像は1:1でなくてもそのまま利用できます。あわせて、駒の見た目サイズはなるべく揃えてください。
            </span>
          </div>
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

      <div className="mt-6 flex gap-3">
        <Button
          onClick={onSubmit}
          disabled={
            isSubmitting ||
            (!form.movePatternId && !form.moveVectorsJson) ||
            (form.hasSkill &&
              form.skillTargetRule === "__adjacent_custom__" &&
              !form.skillTargetAdjacentN.trim())
          }
        >
          {isEditMode ? "更新" : "作成"}
        </Button>
      </div>

      <MoveRangePickerModal
        isOpen={isRangePickerOpen}
        onClose={() => setIsRangePickerOpen(false)}
        onApply={applySelectedRange}
      />
    </section>
  );
}
