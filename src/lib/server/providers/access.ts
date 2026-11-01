import "server-only";
import ServiceError from "../ServiceError";
import { WindowLimiter } from "./rateLimit";

const globals = globalThis as typeof globalThis & { providerManagementLimiter?: WindowLimiter };
const attempts = globals.providerManagementLimiter ??= new WindowLimiter(60);
export function requireManagementAccess(request: Request) {
  if (!attempts.take()) throw new ServiceError("RATE_LIMITED", "Too many management requests. Try again in a minute.");
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  const host = request.headers.get("host") ?? requestUrl.host;
  let sameOrigin = !origin;
  try { sameOrigin ||= origin === new URL(requestUrl.protocol + "//" + host).origin; } catch { /* reject malformed hosts */ }
  if (request.headers.get("sec-fetch-site") === "cross-site" || !sameOrigin) throw ServiceError.forbidden("Use provider settings from the application's own origin");
}
