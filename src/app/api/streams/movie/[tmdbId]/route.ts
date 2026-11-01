import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/streamService";
import { movieStreamParamsSchema, streamQuerySchema } from "@/lib/server/validation/streamRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ params: movieStreamParamsSchema, query: streamQuerySchema }, (p, q) => service.getMovieStreamUrl(p.tmdbId, q.providerId as string | undefined));
