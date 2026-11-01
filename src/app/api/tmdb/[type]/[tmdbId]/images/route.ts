import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/tmdbService";
import { tmdbRecommendationsParamsSchema } from "@/lib/server/validation/tmdbRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ params: tmdbRecommendationsParamsSchema }, (p) => service.getImages(Number(p.tmdbId), p.type as "movie" | "tv"));
