import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/streamService";
import { tvStreamParamsSchema } from "@/lib/server/validation/streamRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ params: tvStreamParamsSchema }, (p) => service.getTvStreamUrl(p.tmdbId, p.season, p.episode));
