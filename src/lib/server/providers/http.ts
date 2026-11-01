import "server-only";
import ServiceError from "../ServiceError";
import { requireManagementAccess } from "./access";

export async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw ServiceError.validationFailed("Use an application/json body");
  const reader = request.body?.getReader();
  if (!reader) throw ServiceError.validationFailed("A JSON body is required");
  const chunks: Uint8Array[] = []; let bytes = 0;
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; void reader.cancel(); }, 5000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16_384) { await reader.cancel(); throw ServiceError.validationFailed("Request body is too large"); }
      chunks.push(value);
    }
    if (timedOut) throw ServiceError.validationFailed("Request body timed out");
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw ServiceError.validationFailed("Invalid or incomplete JSON body");
  } finally { clearTimeout(timer); reader.releaseLock(); }
}
export function providerHandler(run: (request: Request) => unknown | Promise<unknown>, management = false, status = 200) {
  return async (request: Request) => {
    try {
      if (management) requireManagementAccess(request);
      return Response.json(await run(request), { status, headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      const codes: Record<string, number> = { VALIDATION_FAILED: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, RATE_LIMITED: 429 };
      const code = error instanceof ServiceError ? codes[error.code] ?? 500 : 500;
      if (code === 500) console.error("Provider request failed");
      return Response.json({ error: code === 500 ? "Provider operation failed" : (error as Error).message }, {
        status: code, headers: { "Cache-Control": "no-store", ...(code === 429 ? { "Retry-After": "60" } : {}) },
      });
    }
  };
}
