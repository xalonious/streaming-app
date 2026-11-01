import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/tmdbService";
import { tmdbTrendingQuerySchema } from "@/lib/server/validation/tmdbRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ query: tmdbTrendingQuerySchema }, (_params, q) => service.getTrending((q.type ?? "all") as "all" | "movie" | "tv", (q.window ?? "day") as "day" | "week"));
