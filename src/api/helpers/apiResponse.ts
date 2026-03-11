import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function notFound(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function conflict(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 409 });
}

export function serverError(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal error";

  if (message.includes("not found") || message.includes("Not found")) {
    return notFound(message);
  }
  if (
    message.includes("required") ||
    message.includes("invalid") ||
    message.includes("must be")
  ) {
    return badRequest(message);
  }
  if (message.includes("already exists")) {
    return conflict(message);
  }

  return serverError(message);
}
