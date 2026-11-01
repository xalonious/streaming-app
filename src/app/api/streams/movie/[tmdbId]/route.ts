import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/streamService";
import { movieStreamParamsSchema } from "@/lib/server/validation/streamRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ params: movieStreamParamsSchema }, (p) => service.getMovieStreamUrl(p.tmdbId));
