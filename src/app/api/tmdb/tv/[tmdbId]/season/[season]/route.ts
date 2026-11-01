import { routeHandler } from "@/lib/server/routeHandler";
import * as service from "@/lib/server/tmdbService";
import { tvSeasonParamsSchema } from "@/lib/server/validation/tmdbRoutes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({ params: tvSeasonParamsSchema }, (p) => service.getTvSeasonDetails(Number(p.tmdbId), Number(p.season)));
