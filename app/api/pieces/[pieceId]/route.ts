import { NextResponse } from "next/server";
import {
  getPieceById,
  listMoveVectorsByMovePatternId,
  listSkillEffectsBySkillId,
} from "@/features/piece/api/dao/piece.dao";
import { deletePieceUseCase } from "@/features/piece/usecases/delete-piece.usecase";
import { updatePieceUseCase } from "@/features/piece/usecases/update-piece.usecase";
import { parsePieceFormData } from "@/features/piece/utils/piece-form-parser";
import { getSupabaseAdminClient } from "@/shared/lib/supabase-admin-client";

export const runtime = "nodejs";

type Params = {
  params: {
    pieceId: string;
  };
};

function parsePieceId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("pieceId must be a positive integer");
  }
  return id;
}

async function createPieceImageUrl(
  imageBucket: string | null,
  imageKey: string | null,
) {
  if (!imageBucket || !imageKey) return null;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(imageBucket)
    .createSignedUrl(imageKey, 60 * 60);

  if (error) return null;
  return data.signedUrl ?? null;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const pieceId = parsePieceId(params.pieceId);
    const piece = await getPieceById(pieceId);
    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }
    const skillEffects = piece.skillId
      ? await listSkillEffectsBySkillId(piece.skillId)
      : [];
    const moveVectors = await listMoveVectorsByMovePatternId(
      piece.movePatternId,
    );
    const imageUrl = await createPieceImageUrl(
      piece.imageBucket,
      piece.imageKey,
    );

    return NextResponse.json({ piece, skillEffects, moveVectors, imageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request";
    const status = message.includes("positive integer") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const pieceId = parsePieceId(params.pieceId);
    const formData = await request.formData();
    const input = parsePieceFormData(formData);

    const piece = await updatePieceUseCase(pieceId, input);
    return NextResponse.json({ piece });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request";
    const status =
      message.includes("positive integer") ||
      message.includes("required") ||
      message.includes("invalid")
        ? 400
        : message.includes("not found")
          ? 404
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const pieceId = parsePieceId(params.pieceId);
    const result = await deletePieceUseCase(pieceId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request";
    const status = message.includes("positive integer")
      ? 400
      : message.includes("not found")
        ? 404
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
