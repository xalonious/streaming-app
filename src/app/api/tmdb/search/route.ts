import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/tmdbService";
import { tmdbSearchQuerySchema } from "@/lib/server/validation/tmdbRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ query: tmdbSearchQuerySchema }, (_params, q) => service.search(q.q as string, (q.type ?? "multi") as "multi" | "movie" | "tv"));
