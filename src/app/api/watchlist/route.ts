import { routeHandler } from "@/lib/server/routeHandler";
import { listWatchlist } from "@/lib/server/watchlist/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({}, listWatchlist);
