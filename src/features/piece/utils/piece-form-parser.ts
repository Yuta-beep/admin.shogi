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

export function parsePieceFormData(formData: FormData): PieceFormInput {
  const pieceCode = readRequiredString(formData, "pieceCode");
  const kanji = readRequiredString(formData, "kanji");
  const name = readRequiredString(formData, "name");
  const movePatternId = readIntegerString(formData, "movePatternId");

  const skillIdRaw = formData.get("skillId");
  const skillId =
    typeof skillIdRaw === "string" && skillIdRaw.trim().length > 0
      ? readIntegerString(formData, "skillId")
      : null;

  const imageSourceRaw = formData.get("imageSource");
  const imageSource = imageSourceRaw === "s3" ? "s3" : "supabase";

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
    skillId,
    imageSource,
    imageVersion,
    isActive,
    publishedAt,
    unpublishedAt,
    imageFile,
  };
}
