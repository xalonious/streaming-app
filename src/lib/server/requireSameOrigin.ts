import "server-only";
import ServiceError from "./ServiceError";

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const expected = new URL(`${url.protocol}//${request.headers.get("host") ?? url.host}`).origin;
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== expected)) {
    throw ServiceError.forbidden("Use the application's own origin to change saved titles");
  }
}
