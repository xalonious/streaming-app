import { routeHandler } from "@/lib/server/routeHandler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = routeHandler({}, () => ({ pong: true }));
