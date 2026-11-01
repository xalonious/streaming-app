import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/tmdbService";
import { tmdbIdParamsSchema } from "@/lib/server/validation/tmdbRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ params: tmdbIdParamsSchema }, (p) => service.getTvAllEpisodes(Number(p.tmdbId)));
