import { providers } from "@/lib/server/providers/service";
import { providerHandler, readBody } from "@/lib/server/providers/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  return providerHandler(async req => providers().update((await context.params).id, await readBody(req)), true)(request);
}
export async function DELETE(request: Request, context: Context) {
  return providerHandler(async () => { providers().delete((await context.params).id); return { ok: true }; }, true)(request);
}
