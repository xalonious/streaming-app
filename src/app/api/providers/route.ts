import { providers } from "@/lib/server/providers/service";
import { providerHandler, readBody } from "@/lib/server/providers/http";
import ServiceError from "@/lib/server/ServiceError";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = providerHandler(() => ({ providers: providers().list().filter(p => p.enabled) }));
export const POST = providerHandler(async request => providers().save(await readBody(request)), true, 201);
export const PATCH = providerHandler(async request => {
  const body = await readBody(request);
  if (!body || typeof body !== "object" || Object.keys(body).length !== 1 || !("ids" in body) || !Array.isArray(body.ids) || !body.ids.every(id => typeof id === "string")) throw ServiceError.validationFailed("Expected { ids: string[] }");
  return { providers: providers().reorder(body.ids) };
}, true);
