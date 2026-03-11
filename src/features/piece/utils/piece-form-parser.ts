import { PieceFormInput } from "@/features/piece/domain/piece.types";

function readRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function readOptionalDateString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const iso = new Date(value).toISOString();
  if (Number.isNaN(Date.parse(iso))) {
    throw new Error(`${key} is invalid`);
  }
  return iso;
}

function readIntegerString(formData: FormData, key: string, fallback?: number) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${key} is required`);
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${key} must be an integer`);
  }
  return parsed;
}

function readOptionalIntegerString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${key} must be an integer`);
  }
  return parsed;
}

function readOptionalNumberString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a number`);
  }
  return parsed;
}

function parseSkillDraft(formData: FormData, hasSkill: boolean) {
  if (!hasSkill) return null;

  const skillDescRaw = formData.get("skillDesc");
  const effectTypeRaw = formData.get("skillEffectType");
  const targetRuleRaw = formData.get("skillTargetRule");
  const triggerTimingRaw = formData.get("skillTriggerTiming");

  const skillDesc = typeof skillDescRaw === "string" ? skillDescRaw.trim() : "";
  const effectType =
    typeof effectTypeRaw === "string" ? effectTypeRaw.trim() : "";
  const targetRule =
    typeof targetRuleRaw === "string" ? targetRuleRaw.trim() : "";
  const triggerTiming =
    typeof triggerTimingRaw === "string" ? triggerTimingRaw.trim() : "";

  if (!skillDesc) throw new Error("skillDesc is required when creating skill");
  if (!effectType)
    throw new Error("skillEffectType is required when creating skill");
  if (!targetRule)
    throw new Error("skillTargetRule is required when creating skill");
  if (!triggerTiming)
    throw new Error("skillTriggerTiming is required when creating skill");

  const valueTextRaw = formData.get("skillValueText");
  const valueText =
    typeof valueTextRaw === "string" && valueTextRaw.trim().length > 0
      ? valueTextRaw.trim()
      : null;
  if (!valueText)
    throw new Error("skillValueText is required when creating skill");

  const valueNum = readOptionalNumberString(formData, "skillValueNum");
  if (valueNum === null)
    throw new Error("skillValueNum is required when creating skill");
  const procChance = readOptionalNumberString(formData, "skillProcChance");
  if (procChance === null)
    throw new Error("skillProcChance is required when creating skill");
  const durationTurns = readOptionalNumberString(
    formData,
    "skillDurationTurns",
  );
  if (durationTurns === null)
    throw new Error("skillDurationTurns is required when creating skill");
  const radius = readOptionalNumberString(formData, "skillRadius");
  if (radius === null)
    throw new Error("skillRadius is required when creating skill");

  const paramsJsonRaw = formData.get("skillParamsJson");
  let paramsJson: Record<string, unknown> | null = null;
  if (typeof paramsJsonRaw === "string" && paramsJsonRaw.trim().length > 0) {
    try {
      paramsJson = JSON.parse(paramsJsonRaw) as Record<string, unknown>;
    } catch {
      throw new Error("skillParamsJson must be valid JSON");
    }
  }

  return {
    skillDesc,
    effectType,
    targetRule,
    triggerTiming,
    valueText,
    valueNum,
    procChance,
    durationTurns,
    radius,
    paramsJson,
  };
}

function parseMoveVectors(formData: FormData) {
  const raw = formData.get("moveVectorsJson");
  if (typeof raw !== "string" || raw.trim() === "") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("moveVectorsJson must be valid JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("moveVectorsJson must be an array");
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`moveVectorsJson[${index}] must be an object`);
    }
    const row = item as Record<string, unknown>;
    const dx = Number(row.dx);
    const dy = Number(row.dy);
    const maxStep = Number(row.maxStep);

    if (!Number.isInteger(dx) || !Number.isInteger(dy)) {
      throw new Error(`moveVectorsJson[${index}] dx/dy must be integers`);
    }
    if (!Number.isInteger(maxStep) || maxStep <= 0) {
      throw new Error(
        `moveVectorsJson[${index}] maxStep must be a positive integer`,
      );
    }

    return { dx, dy, maxStep };
  });
}

export function parsePieceFormData(formData: FormData): PieceFormInput {
  const pieceCodeRaw = formData.get("pieceCode");
  const pieceCode = typeof pieceCodeRaw === "string" ? pieceCodeRaw.trim() : "";
  const kanji = readRequiredString(formData, "kanji");
  const name = readRequiredString(formData, "name");
  const movePatternId = readOptionalIntegerString(formData, "movePatternId");
  const moveVectors = parseMoveVectors(formData);
  if (!movePatternId && moveVectors.length === 0) {
    throw new Error("movePatternId or moveVectorsJson is required");
  }

  const skillIdRaw = formData.get("skillId");
  const skillId =
    typeof skillIdRaw === "string" && skillIdRaw.trim().length > 0
      ? readIntegerString(formData, "skillId")
      : null;
  const hasSkillRaw = formData.get("hasSkill");
  const hasSkill = hasSkillRaw === "true" || hasSkillRaw === "on";
  const skillDraft = parseSkillDraft(formData, hasSkill);

  const imageSource = "supabase" as const;

  const imageVersion = readIntegerString(formData, "imageVersion", 1);

  const isActiveRaw = formData.get("isActive");
  const isActive = isActiveRaw === "true" || isActiveRaw === "on";

  const publishedAt = readOptionalDateString(formData, "publishedAt");
  const unpublishedAt = readOptionalDateString(formData, "unpublishedAt");

  const imageRaw = formData.get("image");
  const imageFile =
    imageRaw instanceof File && imageRaw.size > 0 ? imageRaw : null;

  return {
    pieceCode,
    kanji,
    name,
    movePatternId,
    moveVectors,
    skillId,
    skillDraft,
    imageSource,
    imageVersion,
    isActive,
    publishedAt,
    unpublishedAt,
    imageFile,
  };
}
