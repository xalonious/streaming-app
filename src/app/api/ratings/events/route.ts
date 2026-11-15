import { getDatabase } from "@/lib/server/db/connection";
import { ratingStream } from "@/lib/server/imdb/ratingStream";
import { RATING_STREAM_BATCH_SIZE, type RatingIdentity } from "@/lib/ratings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const keys = params.get("titles")?.split(",") ?? [];
  if (params.size !== 1 || !keys.length || keys.length > RATING_STREAM_BATCH_SIZE) {
    return Response.json({ error: "Provide a bounded list of movie/TV title IDs" }, { status: 400 });
  }
  const titles: RatingIdentity[] = [];
  for (const key of new Set(keys)) {
    const match = /^(movie|tv):([1-9]\d*)$/.exec(key);
    if (!match || !Number.isSafeInteger(Number(match[2]))) {
      return Response.json({ error: "Invalid rating subscription" }, { status: 400 });
    }
    titles.push({ type: match[1] as RatingIdentity["type"], id: Number(match[2]) });
  }
  return ratingStream(request, titles, getDatabase());
}
