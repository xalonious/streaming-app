import "server-only";
import type { DatabaseSync } from "node:sqlite";
import { ratingKey, type RatingIdentity, type RatingUpdate } from "../../ratings";
import { lookupRatingsAndQueueMissing } from "./mappings";
import { subscribeToRatingChanges } from "./ratingEvents";

export function ratingStream(request: Request, titles: RatingIdentity[], db: DatabaseSync) {
  const encoder = new TextEncoder();
  const watched = new Set(titles.map(ratingKey));
  const sent = new Map<string, string>();
  let dispose = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const resources: { interval?: ReturnType<typeof setInterval> } = {};
      let unsubscribe = () => {};
      const cleanup = () => {
        closed = true;
        clearInterval(resources.interval);
        unsubscribe();
        request.signal.removeEventListener("abort", close);
      };
      const close = () => {
        if (closed) return;
        cleanup();
        controller.close();
      };
      dispose = cleanup;
      const write = (message: string) => {
        if (closed) return;
        if ((controller.desiredSize ?? 0) < 0) { close(); return; }
        try { controller.enqueue(encoder.encode(message)); }
        catch { cleanup(); }
      };
      const snapshot = () => {
        if (closed || db.isTransaction) return;
        const rows = lookupRatingsAndQueueMissing(db, titles);
        const updates: RatingUpdate[] = [];
        for (const title of titles) {
          const row = rows.get(ratingKey(title));
          const rating = row?.average_rating != null
            ? { value: row.average_rating, voteCount: row.vote_count, source: "imdb" as const } : null;
          const signature = JSON.stringify(rating);
          if (sent.get(ratingKey(title)) === signature) continue;
          sent.set(ratingKey(title), signature);
          updates.push({ ...title, rating });
        }
        if (updates.length) write(`event: ratings\ndata: ${JSON.stringify(updates)}\n\n`);
      };
      const refresh = () => {
        try { snapshot(); }
        catch { close(); }
      };

      if (request.signal.aborted) { close(); return; }
      request.signal.addEventListener("abort", close, { once: true });
      unsubscribe = subscribeToRatingChanges((database, changed) => {
        if (database === db && changed.some(title => watched.has(ratingKey(title)))) refresh();
      });
      write("retry: 2000\n\n");
      refresh();
      if (closed) return;
      let ticks = 0;
      resources.interval = setInterval(() => {
        refresh();
        if (++ticks % 3 === 0) write(": heartbeat\n\n");
      }, 5000);
      resources.interval.unref?.();
    },
    cancel() { dispose(); },
  }, { highWaterMark: 65_536, size: chunk => chunk.byteLength });

  return new Response(stream, { headers: {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-store, no-transform",
    "X-Accel-Buffering": "no",
  } });
}
