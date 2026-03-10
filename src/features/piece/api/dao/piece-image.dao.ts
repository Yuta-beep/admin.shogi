import { getSupabaseAdminClient } from "@/shared/lib/supabase-admin-client";

function detectExt(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 8) return fromName.toLowerCase();

  const mime = file.type.toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  return "bin";
}

function sanitizePieceCode(pieceCode: string) {
  return pieceCode.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function uploadPieceImage(input: {
  pieceCode: string;
  imageFile: File;
}) {
  const supabase = getSupabaseAdminClient();
  const bucket = process.env.SUPABASE_PIECE_IMAGE_BUCKET ?? "piece-images";
  const ext = detectExt(input.imageFile);
  const key = `pieces/${sanitizePieceCode(input.pieceCode)}-${Date.now()}.${ext}`;

  const arrayBuffer = await input.imageFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage.from(bucket).upload(key, bytes, {
    cacheControl: "3600",
    contentType: input.imageFile.type || undefined,
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return { imageBucket: bucket, imageKey: key };
}

export async function deletePieceImage(input: {
  imageBucket: string;
  imageKey: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(input.imageBucket)
    .remove([input.imageKey]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}
