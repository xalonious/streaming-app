import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/streamService";
import { tvStreamParamsSchema, streamQuerySchema } from "@/lib/server/validation/streamRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ params: tvStreamParamsSchema, query: streamQuerySchema }, (p, q) => service.getTvStreamUrl(p.tmdbId, p.season, p.episode, q.providerId as string | undefined));
