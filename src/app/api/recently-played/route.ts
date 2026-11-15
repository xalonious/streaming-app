import { routeHandler } from "@/lib/server/routeHandler";
import { listRecentlyPlayed } from "@/lib/server/recently-played/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({}, listRecentlyPlayed);
