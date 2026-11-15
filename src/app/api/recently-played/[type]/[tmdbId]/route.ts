import type { MediaType } from "@/api/tmdb";
import { routeHandler } from "@/lib/server/routeHandler";
import { requireSameOrigin } from "@/lib/server/requireSameOrigin";
import { tmdbRecommendationsParamsSchema } from "@/lib/server/validation/tmdbRoutes";
import { recordRecentlyPlayed } from "@/lib/server/recently-played/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ type: string; tmdbId: string }> };

export function PUT(request: Request, context: Context) {
  return routeHandler({ params: tmdbRecommendationsParamsSchema }, params => {
    requireSameOrigin(request);
    return recordRecentlyPlayed(params.type as MediaType, Number(params.tmdbId));
  })(request, context);
}
