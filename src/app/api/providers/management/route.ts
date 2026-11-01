import { providers } from "@/lib/server/providers/service";
import { providerHandler } from "@/lib/server/providers/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = providerHandler(() => ({ providers: providers().list() }), true);
