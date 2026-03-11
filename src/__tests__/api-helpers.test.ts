import { describe, expect, it } from "bun:test";

import {
  parsePieceId,
  parseQuery,
  parseStageId,
} from "@/api/helpers/apiParams";
import { errorResponse } from "@/api/helpers/apiResponse";

describe("apiParams", () => {
  it("parses positive integer ids", () => {
    expect(parsePieceId("10")).toBe(10);
    expect(parseStageId("7")).toBe(7);
  });

  it("throws for invalid ids", () => {
    expect(() => parsePieceId("0")).toThrow(
      "pieceId must be a positive integer",
    );
    expect(() => parseStageId("-1")).toThrow(
      "stageId must be a positive integer",
    );
    expect(() => parseStageId("1.5")).toThrow(
      "stageId must be a positive integer",
    );
  });

  it("trims nullable query", () => {
    expect(parseQuery("  abc  ")).toBe("abc");
    expect(parseQuery(null)).toBe("");
  });
});

describe("errorResponse", () => {
  it("maps known message categories to expected status", async () => {
    const notFound = errorResponse(new Error("piece not found"));
    const required = errorResponse(new Error("name is required"));
    const invalid = errorResponse(new Error("movePatternId is invalid"));
    const mustBe = errorResponse(new Error("id must be integer"));
    const conflict = errorResponse(new Error("piece already exists"));
    const unknown = errorResponse(new Error("boom"));

    expect(notFound.status).toBe(404);
    expect(required.status).toBe(400);
    expect(invalid.status).toBe(400);
    expect(mustBe.status).toBe(400);
    expect(conflict.status).toBe(409);
    expect(unknown.status).toBe(500);

    await expect(notFound.json()).resolves.toEqual({
      success: false,
      error: "piece not found",
    });
  });

  it("uses fallback message for non-Error values", async () => {
    const response = errorResponse("oops");

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Internal error",
    });
  });
});
