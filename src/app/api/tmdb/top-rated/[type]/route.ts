import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/tmdbService";
import { tmdbTypeParamsSchema } from "@/lib/server/validation/tmdbRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ params: tmdbTypeParamsSchema }, (p) => service.getTopRated(p.type as "movie" | "tv"));
