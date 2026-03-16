# skill v2 admin handoff (ja)

## 1. 方針

- admin は legacy 単発入力 (`effect_type / target_rule / trigger_timing / value_text`) から分離し、skill v2 schema を一次入力とする。
- 既存 skill の参照は `existing` モード、v2 draft 作成/編集は `draft` モードで扱う。
- piece 編集画面では registry 駆動の `group -> option` プルダウンで入力する。

## 2. 参照/保存する DB

- 読み取り:
  - `master.m_skill`
  - `master.m_skill_condition`
  - `master.m_skill_effect`
  - `master.m_skill_schema_group`
  - `master.m_skill_schema_option`
  - `master.m_skill_implementation_kind`
- 保存:
  - `master.m_skill` (implementation_kind / trigger_group / trigger_type / script_hook など v2 メタ)
  - `master.m_skill_condition` (conditions[])
  - `master.m_skill_effect` (effects[])

## 3. legacy skill と v2 skill の扱い

- v2 判定:
  - `m_skill.implementation_kind` / `trigger_group` / `trigger_type` が揃っているものを v2 と扱う。
- legacy 表示:
  - detail では `legacyEffects` として read-only 表示する。
  - 既存 piece が legacy skill を参照していても壊さず表示できる。
- 新規作成:
  - admin から新規作成される skill は v2 形式のみ。

## 4. 画面入力ルール

- skill 設定:
  - `hasSkill=false` なら skill 未設定。
  - `hasSkill=true` + `skillMode=existing` なら既存 skillId を選択。
  - `hasSkill=true` + `skillMode=draft` なら v2 draft を入力。
- draft 入力:
  - 必須: `skillDesc`, `implementationKind`, `trigger.group`, `trigger.type`
  - `conditions[]`: `group`, `type`, `paramsJson`
  - `effects[]`: `group`, `type`, `target.group`, `target.selector`, `paramsJson`
  - `implementationKind=script_hook` の場合:
    - `scriptHook` 必須
    - `effects[]` は空で保存可

## 5. 残り 10 件の扱い

- 対象: `98, 101, 102, 104, 105, 107, 108, 109, 110, 111`
- 現状:
  - `101(安)` と `104(逸)` は stage battle では決定論 hook で近似。
  - `101(安)` 原作対象の「銅」は現行 shogi-ai standard substrate に直接表現なし。
  - `105(進)` は原作の完全ランダム更新ではなく `cyclic_pattern_change` に寄せている。
  - `98 / 107-111` は out_of_scope として残置。
- 今後 admin から扱うための前提:
  - SHOGI_GAME 側で発動条件・対象・持続・盤面効果を明文化。
  - 明文化後に registry option / params を追加し、v2 draft と DB schema の整合を取る。

## 6. 関連ファイル

- DAO: `src/api/dao/skill.dao.ts`
- UseCase: `src/api/useCase/piece.useCase.ts`
- Hook: `src/hooks/use-piece-management.ts`
- Form parser: `src/utils/piece-form-parser.ts`
- Skill form model: `src/utils/skill-form-state.ts`
- UI:
  - `src/components/organisms/piece-form.tsx`
  - `src/components/templates/piece-detail-template.tsx`
  - `src/components/organisms/piece-table.tsx`
