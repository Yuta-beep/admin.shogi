export type ImageDimensions = {
  width: number;
  height: number;
};

function readUint16BE(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32BE(bytes: Uint8Array, offset: number) {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

function readUint32LE(bytes: Uint8Array, offset: number) {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

function detectPngDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 24) return null;

  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) return null;
  }

  const ihdr = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (ihdr !== "IHDR") return null;

  const width = readUint32BE(bytes, 16);
  const height = readUint32BE(bytes, 20);
  if (width <= 0 || height <= 0) return null;

  return { width, height };
}

function detectJpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  const sofMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);

  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1;
    }
    if (offset >= bytes.length) return null;

    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) {
      continue;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      continue;
    }

    if (offset + 1 >= bytes.length) return null;
    const length = readUint16BE(bytes, offset);
    if (length < 2 || offset + length > bytes.length) return null;

    if (sofMarkers.has(marker)) {
      if (length < 7) return null;
      const height = readUint16BE(bytes, offset + 3);
      const width = readUint16BE(bytes, offset + 5);
      if (width <= 0 || height <= 0) return null;
      return { width, height };
    }

    offset += length;
  }

  return null;
}

function detectWebpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 16) return null;

  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff !== "RIFF" || webp !== "WEBP") return null;

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkType = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    );
    const chunkSize = readUint32LE(bytes, offset + 4);
    const dataOffset = offset + 8;

    if (dataOffset + chunkSize > bytes.length) return null;

    if (chunkType === "VP8X") {
      if (chunkSize < 10) return null;
      const widthMinusOne =
        bytes[dataOffset + 4] |
        (bytes[dataOffset + 5] << 8) |
        (bytes[dataOffset + 6] << 16);
      const heightMinusOne =
        bytes[dataOffset + 7] |
        (bytes[dataOffset + 8] << 8) |
        (bytes[dataOffset + 9] << 16);
      return { width: widthMinusOne + 1, height: heightMinusOne + 1 };
    }

    if (chunkType === "VP8L") {
      if (chunkSize < 5 || bytes[dataOffset] !== 0x2f) return null;
      const bits =
        bytes[dataOffset + 1] |
        (bytes[dataOffset + 2] << 8) |
        (bytes[dataOffset + 3] << 16) |
        (bytes[dataOffset + 4] << 24);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      return { width, height };
    }

    if (chunkType === "VP8 ") {
      if (chunkSize < 10) return null;
      const startCode1 = bytes[dataOffset + 3];
      const startCode2 = bytes[dataOffset + 4];
      const startCode3 = bytes[dataOffset + 5];
      if (startCode1 !== 0x9d || startCode2 !== 0x01 || startCode3 !== 0x2a) {
        return null;
      }
      const width = readUint16BE(bytes, dataOffset + 6) & 0x3fff;
      const height = readUint16BE(bytes, dataOffset + 8) & 0x3fff;
      if (width <= 0 || height <= 0) return null;
      return { width, height };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return null;
}

export function detectImageDimensions(
  bytes: Uint8Array,
): ImageDimensions | null {
  return (
    detectPngDimensions(bytes) ??
    detectJpegDimensions(bytes) ??
    detectWebpDimensions(bytes)
  );
}
