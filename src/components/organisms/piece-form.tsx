"use client";

import { useMemo, useState } from "react";
import {
  MovePatternOption,
  MovePatternVector,
  SkillDefinitionRecord,
  SkillOption,
  SkillRegistryDocument,
} from "@/api/model/piece";
import { Button } from "@/components/atoms/button";
import { CheckboxInput } from "@/components/atoms/checkbox-input";
import { FileInput } from "@/components/atoms/file-input";
import { SelectInput } from "@/components/atoms/select-input";
import { TextInput } from "@/components/atoms/text-input";
import { FormField } from "@/components/molecules/form-field";
import { MoveRangePickerModal } from "@/components/organisms/move-range-picker-modal";
import {
  PieceFormState,
  SkillMode,
} from "@/hooks/use-piece-management";
import {
  SkillDraftConditionFormState,
  SkillDraftEffectFormState,
} from "@/utils/skill-form-state";

type Props = {
  form: PieceFormState;
  movePatterns: MovePatternOption[];
  skills: SkillOption[];
  skillRegistry: SkillRegistryDocument;
  selectedSkillDetail: SkillDefinitionRecord | null;
  isEditMode: boolean;
  isSubmitting: boolean;
  onChange: (
    key: keyof PieceFormState,
    value: string | boolean | File | null,
  ) => void;
  updateSkillDraftField: (
    key:
      | "skillDesc"
      | "implementationKind"
      | "skillTriggerGroup"
      | "skillTriggerType"
      | "scriptHook"
      | "skillTagsCsv",
    value: string,
  ) => void;
  addSkillCondition: () => void;
  updateSkillCondition: (
    clientKey: string,
    key: keyof SkillDraftConditionFormState,
    value: string,
  ) => void;
  removeSkillCondition: (clientKey: string) => void;
  addSkillEffect: () => void;
  updateSkillEffect: (
    clientKey: string,
    key: keyof SkillDraftEffectFormState,
    value: string,
  ) => void;
  removeSkillEffect: (clientKey: string) => void;
  loadSelectedSkillAsDraft: () => void;
  onSubmit: () => void;
  onCancel: () => void;
};

function detectCanJumpFromVectors(vectors: MovePatternVector[]) {
  const hasOneStepDirection = new Set<string>();
  for (const v of vectors) {
    if (Math.max(Math.abs(v.dx), Math.abs(v.dy)) === 1) {
      hasOneStepDirection.add(`${Math.sign(v.dx)}:${Math.sign(v.dy)}`);
    }
  }
  return vectors.some((v) => {
    const distance = Math.max(Math.abs(v.dx), Math.abs(v.dy));
    if (distance <= 1) return false;
    const key = `${Math.sign(v.dx)}:${Math.sign(v.dy)}`;
    return !hasOneStepDirection.has(key);
  });
}

export function PieceForm({
  form,
  movePatterns,
  skills,
  skillRegistry,
  selectedSkillDetail,
  isEditMode,
  isSubmitting,
  onChange,
  updateSkillDraftField,
  addSkillCondition,
  updateSkillCondition,
  removeSkillCondition,
  addSkillEffect,
  updateSkillEffect,
  removeSkillEffect,
  loadSelectedSkillAsDraft,
  onSubmit,
  onCancel,
}: Props) {
  const [isRangePickerOpen, setIsRangePickerOpen] = useState(false);
  const [rangeHint, setRangeHint] = useState<string | null>(null);
  const selectedMovePattern = movePatterns.find(
    (pattern) => String(pattern.id) === form.movePatternId,
  );

  const implementationKinds = skillRegistry.implementationKinds;
  const triggerGroups = skillRegistry.registries.trigger.groups;
  const conditionGroups = skillRegistry.registries.condition.groups;
  const effectGroups = skillRegistry.registries.effect.groups;
  const targetGroups = skillRegistry.registries.target.groups;

  const selectedTriggerOptions = useMemo(
    () =>
      triggerGroups.find((group) => group.groupCode === form.skillTriggerGroup)
        ?.options ?? [],
    [form.skillTriggerGroup, triggerGroups],
  );

  function applySelectedRange(vectors: MovePatternVector[]) {
    onChange("movePatternId", "");
    onChange("moveVectorsJson", JSON.stringify(vectors));
    onChange("moveCanJump", detectCanJumpFromVectors(vectors));
    setRangeHint(
      `盤面で選択した移動範囲を適用しました（${vectors.length}ベクトル）。保存時に新規移動パターンを作成します。`,
    );
    setIsRangePickerOpen(false);
  }

  function renderDraftSection() {
    return (
      <div className="space-y-4 rounded-md border border-slate-200 p-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField label="スキル説明" required>
            <TextInput
              value={form.skillDesc}
              onChange={(event) =>
                updateSkillDraftField("skillDesc", event.target.value)
              }
              disabled={isSubmitting}
            />
          </FormField>

          <FormField label="実装種別" required>
            <SelectInput
              value={form.implementationKind}
              onChange={(event) =>
                updateSkillDraftField("implementationKind", event.target.value)
              }
              disabled={isSubmitting}
            >
              <option value="">選択してください</option>
              {implementationKinds.map((kind) => (
                <option key={kind.code} value={kind.code}>
                  {kind.name}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Trigger Group" required>
            <SelectInput
              value={form.skillTriggerGroup}
              onChange={(event) => {
                updateSkillDraftField("skillTriggerGroup", event.target.value);
                updateSkillDraftField("skillTriggerType", "");
              }}
              disabled={isSubmitting}
            >
              <option value="">選択してください</option>
              {triggerGroups.map((group) => (
                <option key={group.groupCode} value={group.groupCode}>
                  {group.groupName}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Trigger Type" required>
            <SelectInput
              value={form.skillTriggerType}
              onChange={(event) =>
                updateSkillDraftField("skillTriggerType", event.target.value)
              }
              disabled={isSubmitting}
            >
              <option value="">選択してください</option>
              {selectedTriggerOptions.map((option) => (
                <option key={option.optionCode} value={option.optionCode}>
                  {option.optionName}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>

        <FormField label="scriptHook（script_hook のとき必須）">
          <TextInput
            value={form.scriptHook}
            onChange={(event) =>
              updateSkillDraftField("scriptHook", event.target.value)
            }
            placeholder="例: reflect_until_blocked"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="tags (comma separated)">
          <TextInput
            value={form.skillTagsCsv}
            onChange={(event) =>
              updateSkillDraftField("skillTagsCsv", event.target.value)
            }
            placeholder="move_trigger, adjacent"
            disabled={isSubmitting}
          />
        </FormField>

        <div className="rounded-md border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Conditions</h4>
            <Button
              variant="neutral"
              className="h-8 px-3 text-xs"
              onClick={addSkillCondition}
              disabled={isSubmitting}
            >
              追加
            </Button>
          </div>
          <div className="space-y-3">
            {form.skillConditions.map((condition) => {
              const options =
                conditionGroups.find(
                  (group) => group.groupCode === condition.group,
                )?.options ?? [];
              return (
                <div
                  key={condition.clientKey}
                  className="grid grid-cols-1 gap-2 rounded border border-slate-200 p-2 md:grid-cols-4"
                >
                  <SelectInput
                    value={condition.group}
                    onChange={(event) =>
                      updateSkillCondition(
                        condition.clientKey,
                        "group",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">Group</option>
                    {conditionGroups.map((group) => (
                      <option key={group.groupCode} value={group.groupCode}>
                        {group.groupName}
                      </option>
                    ))}
                  </SelectInput>
                  <SelectInput
                    value={condition.type}
                    onChange={(event) =>
                      updateSkillCondition(
                        condition.clientKey,
                        "type",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">Type</option>
                    {options.map((option) => (
                      <option key={option.optionCode} value={option.optionCode}>
                        {option.optionName}
                      </option>
                    ))}
                  </SelectInput>
                  <textarea
                    value={condition.paramsJson}
                    onChange={(event) =>
                      updateSkillCondition(
                        condition.clientKey,
                        "paramsJson",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                    className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    placeholder='{"procChance":0.2}'
                  />
                  <Button
                    variant="danger"
                    className="h-10"
                    onClick={() => removeSkillCondition(condition.clientKey)}
                    disabled={isSubmitting}
                  >
                    削除
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Effects</h4>
            <Button
              variant="neutral"
              className="h-8 px-3 text-xs"
              onClick={addSkillEffect}
              disabled={isSubmitting}
            >
              追加
            </Button>
          </div>
          <div className="space-y-3">
            {form.skillEffects.map((effect) => {
              const effectOptions =
                effectGroups.find((group) => group.groupCode === effect.group)
                  ?.options ?? [];
              const targetOptions =
                targetGroups.find(
                  (group) => group.groupCode === effect.targetGroup,
                )?.options ?? [];
              return (
                <div
                  key={effect.clientKey}
                  className="grid grid-cols-1 gap-2 rounded border border-slate-200 p-2 md:grid-cols-6"
                >
                  <SelectInput
                    value={effect.group}
                    onChange={(event) =>
                      updateSkillEffect(
                        effect.clientKey,
                        "group",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">Effect Group</option>
                    {effectGroups.map((group) => (
                      <option key={group.groupCode} value={group.groupCode}>
                        {group.groupName}
                      </option>
                    ))}
                  </SelectInput>
                  <SelectInput
                    value={effect.type}
                    onChange={(event) =>
                      updateSkillEffect(
                        effect.clientKey,
                        "type",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">Effect Type</option>
                    {effectOptions.map((option) => (
                      <option key={option.optionCode} value={option.optionCode}>
                        {option.optionName}
                      </option>
                    ))}
                  </SelectInput>
                  <SelectInput
                    value={effect.targetGroup}
                    onChange={(event) =>
                      updateSkillEffect(
                        effect.clientKey,
                        "targetGroup",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">Target Group</option>
                    {targetGroups.map((group) => (
                      <option key={group.groupCode} value={group.groupCode}>
                        {group.groupName}
                      </option>
                    ))}
                  </SelectInput>
                  <SelectInput
                    value={effect.targetSelector}
                    onChange={(event) =>
                      updateSkillEffect(
                        effect.clientKey,
                        "targetSelector",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">Target Selector</option>
                    {targetOptions.map((option) => (
                      <option key={option.optionCode} value={option.optionCode}>
                        {option.optionName}
                      </option>
                    ))}
                  </SelectInput>
                  <textarea
                    value={effect.paramsJson}
                    onChange={(event) =>
                      updateSkillEffect(
                        effect.clientKey,
                        "paramsJson",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                    className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    placeholder='{"radius":1}'
                  />
                  <Button
                    variant="danger"
                    className="h-10"
                    onClick={() => removeSkillEffect(effect.clientKey)}
                    disabled={isSubmitting}
                  >
                    削除
                  </Button>
                </div>
              );
            })}
          </div>
          {form.implementationKind === "script_hook" ? (
            <p className="mt-2 text-xs text-slate-500">
              script_hook は effect 行を空でも保存できます。
            </p>
          ) : null}
        </div>
      </div>
    );
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
            onChange={(event) => onChange("kanji", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="駒名" required>
          <TextInput
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="レアリティ" required>
          <SelectInput
            value={form.rarity}
            onChange={(event) => onChange("rarity", event.target.value)}
            disabled={isSubmitting}
          >
            <option value="N">N</option>
            <option value="R">R</option>
            <option value="SR">SR</option>
            <option value="UR">UR</option>
            <option value="SSR">SSR</option>
          </SelectInput>
        </FormField>
        <FormField label="移動説明（任意）">
          <TextInput
            value={form.moveDescriptionJa}
            onChange={(event) =>
              onChange("moveDescriptionJa", event.target.value)
            }
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="駒移動範囲" required>
          <div className="flex flex-col gap-2">
            <Button
              variant="neutral"
              className="h-9 px-3 text-xs"
              onClick={() => setIsRangePickerOpen(true)}
              disabled={isSubmitting}
            >
              盤面で移動範囲を選択
            </Button>
            <div className="text-xs text-slate-600">
              {form.moveVectorsJson
                ? "盤面選択済み（保存時に新規移動パターン作成）"
                : selectedMovePattern
                  ? `選択中: ${selectedMovePattern.moveName}`
                  : "未選択"}
            </div>
            {rangeHint ? <div className="text-xs text-slate-500">{rangeHint}</div> : null}
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
                  onChange={(event) =>
                    onChange("moveCanJump", event.target.checked)
                  }
                  disabled={isSubmitting}
                />
                <span className="text-sm text-slate-700">駒を飛び越え可能</span>
              </div>
            </FormField>
            <FormField label="特殊移動タイプ">
              <SelectInput
                value={form.specialMoveType}
                onChange={(event) =>
                  onChange("specialMoveType", event.target.value)
                }
                disabled={isSubmitting}
              >
                <option value="none">なし</option>
                <option value="immobile">移動不可</option>
                <option value="turn_parity_moon">月タイプ（奇偶）</option>
                <option value="copy_front_enemy_move">正面敵コピー</option>
                <option value="copy_last_enemy_move">直前敵手コピー</option>
              </SelectInput>
            </FormField>
          </div>
        </div>

        <div className="md:col-span-2 rounded-md border border-slate-200 p-3">
          <div className="mb-2 text-sm font-semibold text-slate-800">
            スキル設定（v2）
          </div>
          <div className="mb-3 flex items-center gap-2">
            <CheckboxInput
              checked={form.hasSkill}
              onChange={(event) => onChange("hasSkill", event.target.checked)}
              disabled={isSubmitting}
            />
            <span className="text-sm text-slate-700">スキルあり</span>
          </div>

          {form.hasSkill ? (
            <div className="space-y-3">
              <FormField label="選択モード" required>
                <SelectInput
                  value={form.skillMode}
                  onChange={(event) =>
                    onChange("skillMode", event.target.value as SkillMode)
                  }
                  disabled={isSubmitting}
                >
                  <option value="existing">既存スキルを使う</option>
                  <option value="draft">新規 draft を作る</option>
                </SelectInput>
              </FormField>

              {form.skillMode === "existing" ? (
                <div className="space-y-3">
                  <FormField label="スキル" required>
                    <SelectInput
                      value={form.skillId}
                      onChange={(event) => onChange("skillId", event.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">選択してください</option>
                      {skills.map((skill) => (
                        <option key={skill.id} value={String(skill.id)}>
                          {skill.id} / {skill.skillDesc} [{skill.version}]
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                  {selectedSkillDetail ? (
                    <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      <div>implementation: {selectedSkillDetail.implementationKind ?? "-"}</div>
                      <div>
                        trigger: {selectedSkillDetail.trigger.group ?? "-"} /{" "}
                        {selectedSkillDetail.trigger.type ?? "-"}
                      </div>
                      <div>conditions: {selectedSkillDetail.conditions.length}</div>
                      <div>effects: {selectedSkillDetail.effects.length}</div>
                      <div>script_hook: {selectedSkillDetail.scriptHook ?? "-"}</div>
                      {selectedSkillDetail.version === "v2" ? (
                        <Button
                          variant="neutral"
                          className="mt-2 h-8 px-3 text-xs"
                          onClick={loadSelectedSkillAsDraft}
                          disabled={isSubmitting}
                        >
                          この定義を draft 編集に取り込む
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                renderDraftSection()
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              スキルを使う場合は「スキルあり」を有効にしてください。
            </p>
          )}
        </div>

        <FormField label="画像バージョン" required>
          <TextInput
            type="number"
            min={1}
            value={form.imageVersion}
            onChange={(event) => onChange("imageVersion", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="画像アップロード">
          <FileInput
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) =>
              onChange("imageFile", event.target.files?.[0] ?? null)
            }
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="公開開始日時">
          <TextInput
            type="datetime-local"
            value={form.publishedAt}
            onChange={(event) => onChange("publishedAt", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="公開終了日時">
          <TextInput
            type="datetime-local"
            value={form.unpublishedAt}
            onChange={(event) => onChange("unpublishedAt", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <CheckboxInput
          checked={form.isActive}
          onChange={(event) => onChange("isActive", event.target.checked)}
          disabled={isSubmitting}
        />
        <span className="text-sm text-slate-700">有効</span>
      </div>

      <div className="mt-4">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || (!form.movePatternId && !form.moveVectorsJson)}
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
