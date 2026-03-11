function sanitize(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();
}

export function normalizePieceCode(value: string | null | undefined) {
  if (!value) return null;
  const sanitized = sanitize(value.trim());
  return sanitized.length > 0 ? sanitized : null;
}

export function generatePieceCode() {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return sanitize(`P${time}${random}`);
}
