import { NextResponse } from "next/server";
import { createPieceUseCase } from "@/features/piece/usecases/create-piece.usecase";
import { listPiecesUseCase } from "@/features/piece/usecases/list-pieces.usecase";
import { pieceSearchUseCase } from "@/features/piece/usecases/piece-search.usecase";
import { parsePieceFormData } from "@/features/piece/utils/piece-form-parser";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") ?? "").trim();
    const data = query
      ? await pieceSearchUseCase(query)
      : await listPiecesUseCase();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const input = parsePieceFormData(formData);
    const piece = await createPieceUseCase(input);
    return NextResponse.json({ piece }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request";
    const status =
      message.includes("required") || message.includes("invalid") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
