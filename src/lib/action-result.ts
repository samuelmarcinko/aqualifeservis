export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Convert a thrown error into a safe user-facing message. */
export function toSafeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Nastala neočakávaná chyba.";
}
