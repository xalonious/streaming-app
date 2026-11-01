import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/tmdbService";
import { tmdbDiscoverParamsSchema } from "@/lib/server/validation/tmdbRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ params: tmdbDiscoverParamsSchema }, (p) => service.discoverByGenre(p.type as "movie" | "tv", Number(p.genreId)));
