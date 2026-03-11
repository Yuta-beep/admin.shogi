"use client";

import { GachaPieceOption } from "@/api/model/gacha";
import { Button } from "@/components/atoms/button";
import { CheckboxInput } from "@/components/atoms/checkbox-input";
import { FormField } from "@/components/molecules/form-field";
import { SelectInput } from "@/components/atoms/select-input";
import { TextInput } from "@/components/atoms/text-input";

type FormState = {
  gachaId: number | null;
  gachaCode: string;
  gachaName: string;
  description: string;
  rarityRateN: string;
  rarityRateR: string;
  rarityRateSr: string;
  rarityRateUr: string;
  rarityRateSsr: string;
  pawnCost: string;
  goldCost: string;
  imageSource: string;
  imageBucket: string;
  imageKey: string;
  imageVersion: string;
  isActive: boolean;
  publishedAt: string;
  unpublishedAt: string;
};

type PieceSelection = {
  selected: boolean;
  weight: string;
  isActive: boolean;
};

type Props = {
  form: FormState;
  pieceOptions: GachaPieceOption[];
  selectionByPieceId: Record<number, PieceSelection>;
  isEditMode: boolean;
  isSubmitting: boolean;
  onChange: (key: keyof FormState, value: string | boolean) => void;
  onTogglePieceSelection: (pieceId: number) => void;
  onSetPieceWeight: (pieceId: number, weight: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function GachaForm({
  form,
  pieceOptions,
  selectionByPieceId,
  isEditMode,
  isSubmitting,
  onChange,
  onTogglePieceSelection,
  onSetPieceWeight,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        {isEditMode ? "ガチャ更新" : "ガチャ作成"}
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="ガチャコード" required>
          <TextInput
            value={form.gachaCode}
            onChange={(event) => onChange("gachaCode", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="ガチャ名" required>
          <TextInput
            value={form.gachaName}
            onChange={(event) => onChange("gachaName", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="説明">
          <TextInput
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="画像ソース">
          <SelectInput
            value={form.imageSource}
            onChange={(event) => onChange("imageSource", event.target.value)}
            disabled={isSubmitting}
          >
            <option value="supabase">supabase</option>
            <option value="s3">s3</option>
          </SelectInput>
        </FormField>

        <FormField label="N確率" required>
          <TextInput
            type="number"
            step="0.0001"
            min="0"
            max="1"
            value={form.rarityRateN}
            onChange={(event) => onChange("rarityRateN", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="R確率" required>
          <TextInput
            type="number"
            step="0.0001"
            min="0"
            max="1"
            value={form.rarityRateR}
            onChange={(event) => onChange("rarityRateR", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="SR確率" required>
          <TextInput
            type="number"
            step="0.0001"
            min="0"
            max="1"
            value={form.rarityRateSr}
            onChange={(event) => onChange("rarityRateSr", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="UR確率" required>
          <TextInput
            type="number"
            step="0.0001"
            min="0"
            max="1"
            value={form.rarityRateUr}
            onChange={(event) => onChange("rarityRateUr", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="SSR確率" required>
          <TextInput
            type="number"
            step="0.0001"
            min="0"
            max="1"
            value={form.rarityRateSsr}
            onChange={(event) => onChange("rarityRateSsr", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="歩コスト" required>
          <TextInput
            type="number"
            min="0"
            value={form.pawnCost}
            onChange={(event) => onChange("pawnCost", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="金コスト" required>
          <TextInput
            type="number"
            min="0"
            value={form.goldCost}
            onChange={(event) => onChange("goldCost", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="画像バケット">
          <TextInput
            value={form.imageBucket}
            onChange={(event) => onChange("imageBucket", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="画像キー">
          <TextInput
            value={form.imageKey}
            onChange={(event) => onChange("imageKey", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField label="画像バージョン">
          <TextInput
            type="number"
            min="1"
            value={form.imageVersion}
            onChange={(event) => onChange("imageVersion", event.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <FormField label="画像比率（固定）">
          <TextInput value="3:1" disabled />
          <p className="mt-1 text-xs text-amber-700">
            ガチャ画像は横:縦 = 3:1 で作成してください。3:1以外は登録できません。
          </p>
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

        <div className="flex items-center gap-2 pt-7">
          <CheckboxInput
            checked={form.isActive}
            onChange={(event) => onChange("isActive", event.target.checked)}
            disabled={isSubmitting}
          />
          <span className="text-sm text-slate-700">有効</span>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 p-4">
        <h3 className="mb-2 text-base font-semibold text-slate-900">対象駒</h3>
        <p className="mb-3 text-xs text-slate-500">
          対象駒を選択して重みを設定します。
        </p>
        <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
          {pieceOptions.map((piece) => {
            const entry = selectionByPieceId[piece.pieceId] ?? {
              selected: false,
              weight: "1",
              isActive: true,
            };
            return (
              <div
                key={piece.pieceId}
                className="rounded-md border border-slate-200 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-800">
                    <CheckboxInput
                      checked={entry.selected}
                      onChange={() => onTogglePieceSelection(piece.pieceId)}
                      disabled={isSubmitting}
                    />
                    <span>
                      {piece.char} {piece.name} ({piece.rarity})
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">重み</span>
                    <TextInput
                      type="number"
                      min="1"
                      value={entry.weight}
                      disabled={isSubmitting || !entry.selected}
                      onChange={(event) =>
                        onSetPieceWeight(piece.pieceId, event.target.value)
                      }
                      className="h-8 w-16"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isEditMode ? "更新" : "作成"}
        </Button>
        <Button variant="neutral" onClick={onCancel} disabled={isSubmitting}>
          リセット
        </Button>
      </div>
    </section>
  );
}
