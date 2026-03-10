"use client";

import { Button } from "@/features/piece/components/atoms/button";
import { CheckboxInput } from "@/features/piece/components/atoms/checkbox-input";
import { FileInput } from "@/features/piece/components/atoms/file-input";
import { SelectInput } from "@/features/piece/components/atoms/select-input";
import { TextInput } from "@/features/piece/components/atoms/text-input";
import { FormField } from "@/features/piece/components/molecules/form-field";
import {
  MovePatternOption,
  SkillOption,
} from "@/features/piece/domain/piece.types";

type FormState = {
  pieceId: number | null;
  pieceCode: string;
  kanji: string;
  name: string;
  movePatternId: string;
  skillId: string;
  imageSource: "supabase" | "s3";
  imageVersion: string;
  isActive: boolean;
  publishedAt: string;
  unpublishedAt: string;
  imageFile: File | null;
};

type Props = {
  form: FormState;
  movePatterns: MovePatternOption[];
  skills: SkillOption[];
  isEditMode: boolean;
  isSubmitting: boolean;
  onChange: (
    key: keyof FormState,
    value: string | boolean | File | null,
  ) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function PieceForm({
  form,
  movePatterns,
  skills,
  isEditMode,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
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
        <FormField label="駒コード" required>
          <TextInput
            value={form.pieceCode}
            onChange={(e) => onChange("pieceCode", e.target.value)}
            placeholder="例: FU"
            disabled={isSubmitting}
          />
        </FormField>

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

        <FormField label="移動パターン" required>
          <SelectInput
            value={form.movePatternId}
            onChange={(e) => onChange("movePatternId", e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">選択してください</option>
            {movePatterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {pattern.id}: {pattern.moveName} ({pattern.moveCode})
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="スキル">
          <SelectInput
            value={form.skillId}
            onChange={(e) => onChange("skillId", e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">なし</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.id}: {skill.skillName} ({skill.skillCode})
              </option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="画像ソース" required>
          <SelectInput
            value={form.imageSource}
            onChange={(e) => onChange("imageSource", e.target.value)}
            disabled={isSubmitting}
          >
            <option value="supabase">supabase</option>
            <option value="s3">s3</option>
          </SelectInput>
        </FormField>

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
          <FileInput
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => onChange("imageFile", e.target.files?.[0] ?? null)}
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

      <div className="mt-6 flex gap-3">
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isEditMode ? "更新" : "作成"}
        </Button>
      </div>
    </section>
  );
}
