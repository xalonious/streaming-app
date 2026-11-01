import "server-only";
import type { Schema, ValidationError } from "joi";
import ServiceError from "./ServiceError";

type Params = Record<string, string>;
type Query = Record<string, string | string[]>;
type Context = { params: Promise<Params> };
const options = { abortEarly: true, allowUnknown: false, convert: true, presence: "required" as const };
const statuses: Record<string, number> = {
  NOT_FOUND: 404, VALIDATION_FAILED: 400, UNAUTHORIZED: 401,
  FORBIDDEN: 403, CONFLICT: 409, INTERNAL_SERVER_ERROR: 500,
};
function format(error: ValidationError) {
  return Object.fromEntries(error.details.map(({ message, path }) => [path.join("."), message]));
}
export function routeHandler(
  schemas: { params?: Schema; query?: Schema },
  run: (params: Params, query: Query) => unknown | Promise<unknown>,
) {
  return async (request: Request, context: Context) => {
    const started = Date.now();
    let status = 200;
    const respond = (body: unknown, code = 200) => {
      status = code;
      return Response.json(body, { status: code, headers: { "Cache-Control": "no-store" } });
    };
    try {
      const params = await context.params;
      const query: Query = {};
      for (const [key, value] of new URL(request.url).searchParams) {
        const previous = query[key];
        query[key] = previous === undefined ? value : [...(Array.isArray(previous) ? previous : [previous]), value];
      }
      const errors: Record<string, Record<string, string>> = {};
      for (const [part, schema] of Object.entries(schemas)) {
        const { error } = schema.validate(part === "params" ? params : query, options);
        if (error) errors[part] = format(error);
      }
      if (Object.keys(errors).length) {
        return respond({ code: "VALIDATION_FAILED", message: "Validation failed", details: errors }, 400);
      }
      return respond(await run(params, query));
    } catch (error) {
      if (error instanceof ServiceError) {
        const code = statuses[error.code] ?? 500;
        if (code === 500) console.error(`${request.method} ${new URL(request.url).pathname}: ${error.message}`);
        return respond({ error: error.message }, code);
      }
      console.error(`${request.method} ${new URL(request.url).pathname}: unexpected server error`);
      return respond({ error: "Unexpected error occurred" }, 500);
    } finally {
      if (process.env.NODE_ENV === "development") {
        console.info(`${request.method} ${status} ${new URL(request.url).pathname} ${Date.now() - started}ms`);
      }
    }
  };
}
