import { describe, expect, it } from "bun:test";
import { parsePieceFormData } from "@/features/piece/utils/piece-form-parser";

function createBaseFormData() {
  const fd = new FormData();
  fd.set("pieceCode", " FU ");
  fd.set("kanji", " 歩 ");
  fd.set("name", " 歩兵 ");
  fd.set("movePatternId", "1");
  fd.set("skillId", "");
  fd.set("imageSource", "s3");
  fd.set("imageVersion", "2");
  fd.set("isActive", "true");
  fd.set("publishedAt", "2026-03-10T10:00");
  fd.set("unpublishedAt", "");
  return fd;
}

describe("parsePieceFormData", () => {
  it("parses required fields and normalizes values", () => {
    const fd = createBaseFormData();
    const image = new File(["image"], "piece.png", { type: "image/png" });
    fd.set("image", image);

    const result = parsePieceFormData(fd);

    expect(result.pieceCode).toBe("FU");
    expect(result.kanji).toBe("歩");
    expect(result.name).toBe("歩兵");
    expect(result.movePatternId).toBe(1);
    expect(result.skillId).toBeNull();
    expect(result.imageSource).toBe("s3");
    expect(result.imageVersion).toBe(2);
    expect(result.isActive).toBe(true);
    expect(result.publishedAt).toContain("2026-03-10");
    expect(result.unpublishedAt).toBeNull();
    expect(result.imageFile?.name).toBe("piece.png");
  });

  it("defaults imageSource to supabase and imageVersion to 1", () => {
    const fd = createBaseFormData();
    fd.delete("imageSource");
    fd.delete("imageVersion");

    const result = parsePieceFormData(fd);

    expect(result.imageSource).toBe("supabase");
    expect(result.imageVersion).toBe(1);
  });

  it("throws when required fields are missing", () => {
    const fd = new FormData();
    fd.set("pieceCode", "FU");

    expect(() => parsePieceFormData(fd)).toThrow("kanji is required");
  });

  it("throws when integer fields are invalid", () => {
    const fd = createBaseFormData();
    fd.set("movePatternId", "abc");

    expect(() => parsePieceFormData(fd)).toThrow(
      "movePatternId must be an integer",
    );
  });
});
