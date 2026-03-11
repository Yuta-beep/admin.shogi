import { describe, expect, it } from "bun:test";

import { detectImageDimensions } from "@/utils/image-dimensions";

function png(width: number, height: number) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x00, 0x00, 0x00, 0x0d], 8);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  bytes[16] = (width >>> 24) & 0xff;
  bytes[17] = (width >>> 16) & 0xff;
  bytes[18] = (width >>> 8) & 0xff;
  bytes[19] = width & 0xff;
  bytes[20] = (height >>> 24) & 0xff;
  bytes[21] = (height >>> 16) & 0xff;
  bytes[22] = (height >>> 8) & 0xff;
  bytes[23] = height & 0xff;
  return bytes;
}

function jpeg(width: number, height: number) {
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x01,
    0x00,
    0x00,
    0x01,
    0x00,
    0x01,
    0x00,
    0x00,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >>> 8) & 0xff,
    height & 0xff,
    (width >>> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00,
    0xff,
    0xd9,
  ]);
}

function webpVp8x(width: number, height: number) {
  const chunkSize = 10;
  const fileSize = 4 + 8 + chunkSize;
  const bytes = new Uint8Array(12 + 8 + chunkSize);

  bytes.set([0x52, 0x49, 0x46, 0x46], 0);
  bytes[4] = fileSize & 0xff;
  bytes[5] = (fileSize >>> 8) & 0xff;
  bytes[6] = (fileSize >>> 16) & 0xff;
  bytes[7] = (fileSize >>> 24) & 0xff;
  bytes.set([0x57, 0x45, 0x42, 0x50], 8);

  bytes.set([0x56, 0x50, 0x38, 0x58], 12);
  bytes[16] = chunkSize;
  bytes[17] = 0;
  bytes[18] = 0;
  bytes[19] = 0;

  const widthMinusOne = width - 1;
  const heightMinusOne = height - 1;
  bytes[24] = widthMinusOne & 0xff;
  bytes[25] = (widthMinusOne >>> 8) & 0xff;
  bytes[26] = (widthMinusOne >>> 16) & 0xff;
  bytes[27] = heightMinusOne & 0xff;
  bytes[28] = (heightMinusOne >>> 8) & 0xff;
  bytes[29] = (heightMinusOne >>> 16) & 0xff;

  return bytes;
}

describe("detectImageDimensions", () => {
  it("detects PNG dimensions", () => {
    expect(detectImageDimensions(png(120, 80))).toEqual({
      width: 120,
      height: 80,
    });
  });

  it("detects JPEG dimensions", () => {
    expect(detectImageDimensions(jpeg(64, 64))).toEqual({
      width: 64,
      height: 64,
    });
  });

  it("detects WEBP dimensions from VP8X", () => {
    expect(detectImageDimensions(webpVp8x(300, 200))).toEqual({
      width: 300,
      height: 200,
    });
  });

  it("returns null for unsupported content", () => {
    expect(detectImageDimensions(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });
});
