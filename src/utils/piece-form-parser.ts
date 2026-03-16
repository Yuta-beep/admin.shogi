import { PieceFormInput } from "@/types/piece";
import { buildSkillDraftInputFromFormValues } from "@/utils/skill-form-state";

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

function readRarity(formData: FormData): "N" | "R" | "SR" | "UR" | "SSR" {
  const value = formData.get("rarity");
  const rarity = typeof value === "string" ? value.trim().toUpperCase() : "N";
  if (
    rarity === "N" ||
    rarity === "R" ||
    rarity === "SR" ||
    rarity === "UR" ||
    rarity === "SSR"
  ) {
    return rarity;
  }
  throw new Error("rarity is invalid");
}

function parseSkillDraft(formData: FormData, hasSkill: boolean) {
  if (!hasSkill) return { skillId: null, skillDraft: null };

  const skillModeRaw = formData.get("skillMode");
  const skillMode =
    typeof skillModeRaw === "string" ? skillModeRaw.trim() : "existing";

  if (skillMode === "existing") {
    const skillId = readIntegerString(formData, "skillId");
    return { skillId, skillDraft: null };
  }

  if (skillMode !== "draft") {
    throw new Error("skillMode is invalid");
  }

  const skillDraft = buildSkillDraftInputFromFormValues({
    skillDesc: readRequiredString(formData, "skillDesc"),
    implementationKind: readRequiredString(formData, "implementationKind"),
    triggerGroup: readRequiredString(formData, "skillTriggerGroup"),
    triggerType: readRequiredString(formData, "skillTriggerType"),
    scriptHook:
      typeof formData.get("scriptHook") === "string"
        ? String(formData.get("scriptHook"))
        : "",
    tagsCsv:
      typeof formData.get("skillTagsCsv") === "string"
        ? String(formData.get("skillTagsCsv"))
        : "",
    conditions: parseSkillConditions(formData),
    effects: parseSkillEffects(formData),
  });

  return { skillId: null, skillDraft };
}

function parseSkillConditions(formData: FormData) {
  const raw = formData.get("skillConditionsJson");
  if (typeof raw !== "string" || raw.trim() === "") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("skillConditionsJson must be valid JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("skillConditionsJson must be an array");
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`skillConditionsJson[${index}] must be an object`);
    }
    const row = item as Record<string, unknown>;
    return {
      clientKey:
        typeof row.clientKey === "string" ? row.clientKey : `condition_${index}`,
      group: typeof row.group === "string" ? row.group : "",
      type: typeof row.type === "string" ? row.type : "",
      paramsJson:
        typeof row.paramsJson === "string" ? row.paramsJson : JSON.stringify({}),
    };
  });
}

function parseSkillEffects(formData: FormData) {
  const raw = formData.get("skillEffectsJson");
  if (typeof raw !== "string" || raw.trim() === "") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("skillEffectsJson must be valid JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("skillEffectsJson must be an array");
  }

  return parsed.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`skillEffectsJson[${index}] must be an object`);
    }
    const row = item as Record<string, unknown>;
    return {
      clientKey:
        typeof row.clientKey === "string" ? row.clientKey : `effect_${index}`,
      group: typeof row.group === "string" ? row.group : "",
      type: typeof row.type === "string" ? row.type : "",
      targetGroup:
        typeof row.targetGroup === "string" ? row.targetGroup : "",
      targetSelector:
        typeof row.targetSelector === "string" ? row.targetSelector : "",
      paramsJson:
        typeof row.paramsJson === "string" ? row.paramsJson : JSON.stringify({}),
    };
  });
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

function parseSpecialMove(formData: FormData): {
  moveConstraintsJson: Record<string, unknown> | null;
  moveRulesJson: Array<{
    ruleType: string;
    priority?: number;
    paramsJson?: Record<string, unknown> | null;
  }> | null;
} {
  const raw = formData.get("specialMoveType");
  const specialMoveType = typeof raw === "string" ? raw.trim() : "none";

  switch (specialMoveType) {
    case "none":
      return { moveConstraintsJson: null, moveRulesJson: null };
    case "immobile":
      return {
        moveConstraintsJson: null,
        moveRulesJson: [
          {
            ruleType: "immobile",
            priority: 0,
            paramsJson: { source: "admin_form" },
          },
        ],
      };
    case "copy_front_enemy_move":
      return {
        moveConstraintsJson: null,
        moveRulesJson: [
          {
            ruleType: "copy_front_enemy_move",
            priority: 10,
            paramsJson: { source: "admin_form" },
          },
        ],
      };
    case "copy_last_enemy_move":
      return {
        moveConstraintsJson: null,
        moveRulesJson: [
          {
            ruleType: "copy_last_enemy_move",
            priority: 10,
            paramsJson: { source: "admin_form" },
          },
        ],
      };
    case "turn_parity_moon":
      return {
        moveConstraintsJson: null,
        moveRulesJson: [
          {
            ruleType: "turn_parity_override",
            priority: 10,
            paramsJson: {
              odd: { type: "step_limit", max_step: 1, rays: "queen" },
              even: {
                type: "step_limit",
                min_step: 2,
                max_step: 2,
                rays: "queen",
              },
              source: "admin_form",
            },
          },
        ],
      };
    default:
      throw new Error("specialMoveType is invalid");
  }
}

export function parsePieceFormData(formData: FormData): PieceFormInput {
  const pieceCodeRaw = formData.get("pieceCode");
  const pieceCode = typeof pieceCodeRaw === "string" ? pieceCodeRaw.trim() : "";
  const kanji = readRequiredString(formData, "kanji");
  const name = readRequiredString(formData, "name");
  const rarity = readRarity(formData);
  const moveDescriptionRaw = formData.get("moveDescriptionJa");
  const moveDescriptionJa =
    typeof moveDescriptionRaw === "string" && moveDescriptionRaw.trim() !== ""
      ? moveDescriptionRaw.trim()
      : null;
  const movePatternId = readOptionalIntegerString(formData, "movePatternId");
  const moveVectors = parseMoveVectors(formData);
  if (!movePatternId && moveVectors.length === 0) {
    throw new Error("movePatternId or moveVectorsJson is required");
  }
  const moveCanJumpRaw = formData.get("moveCanJump");
  const moveCanJump =
    moveCanJumpRaw === null || moveCanJumpRaw === ""
      ? null
      : moveCanJumpRaw === "true" || moveCanJumpRaw === "on";
  const { moveConstraintsJson, moveRulesJson } = parseSpecialMove(formData);

  const hasSkillRaw = formData.get("hasSkill");
  const hasSkill = hasSkillRaw === "true" || hasSkillRaw === "on";
  const { skillId, skillDraft } = parseSkillDraft(formData, hasSkill);

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
    rarity,
    moveDescriptionJa,
    movePatternId,
    moveVectors,
    moveCanJump,
    moveConstraintsJson,
    moveRulesJson,
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
