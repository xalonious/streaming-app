import "server-only";
import cron from "node-cron";
import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";
import { getDatabase, databasePath } from "../db/connection";
import { IMDB_CONFIG } from "./constants";
import { getCache } from "../cache/cache";
import { needsTopRatedRefresh, TOP_RATED_CONFIG } from "./top-rated";

export function needsImport(lastSuccess: number | null, hasRatings: boolean, now = Date.now()) {
  return !hasRatings || !lastSuccess || now - lastSuccess >= IMDB_CONFIG.maxAge;
}
export function launchImportWorker(scheduled = false): Promise<void> & { child?: ChildProcess } {
  const child = spawn(process.execPath, [join(process.cwd(), "runtime", "imdb-worker.cjs"), ...(scheduled ? ["--scheduled"] : [])], {
    windowsHide: true, stdio: ["ignore", "inherit", "inherit", "ipc"],
    env: { ...process.env, DATABASE_PATH: databasePath() },
  });
  const timer = setTimeout(() => child.kill(), IMDB_CONFIG.timeout + TOP_RATED_CONFIG.refreshTimeout + 60_000);
  const promise = new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", code => code === 0 ? resolve() : reject(new Error(`IMDb worker exited (${code})`)));
  }).finally(() => clearTimeout(timer));
  return Object.assign(promise, { child });
}

export function createRefreshController(
  run: (scheduled: boolean) => Promise<void>, due: (scheduled: boolean) => boolean,
  later: (callback: () => void, delay: number) => ReturnType<typeof setTimeout> = setTimeout,
) {
  let running: Promise<void> | undefined, retry: ReturnType<typeof setTimeout> | undefined, attempts = 0, stopped = false;
  const trigger = (scheduled = false) => {
    if (stopped || retry || !due(scheduled)) return Promise.resolve();
    if (running) return running;
    running = Promise.resolve().then(() => run(scheduled)).then(() => { attempts = 0; }).catch(() => {
      console.warn("IMDb refresh failed; existing ratings and prepared lists retained");
      const delay = IMDB_CONFIG.retryDelays[attempts++];
      if (delay !== undefined && !stopped) {
        retry = later(() => { retry = undefined; void trigger(scheduled); }, delay);
        retry.unref?.();
      }
    }).finally(() => { running = undefined; });
    return running;
  };
  return { trigger, stop() { stopped = true; if (retry) clearTimeout(retry); } };
}

const state = globalThis as typeof globalThis & { streamingScheduler?: { stop: () => void } };
export function startScheduler(dependencies: {
  launch?: typeof launchImportWorker;
  schedule?: (expression: string, callback: () => Promise<void>, options: { timezone: string; noOverlap: boolean; unref: boolean }) => { destroy: () => void | Promise<void> };
} = {}) {
  if (state.streamingScheduler) return state.streamingScheduler;
  const db = getDatabase();
  let child: ChildProcess | undefined;
  const controller = createRefreshController(scheduled => {
    const worker = (dependencies.launch ?? launchImportWorker)(scheduled); child = worker.child; return worker;
  }, scheduled => {
    const row = db.prepare("SELECT last_success FROM import_metadata WHERE id=1").get() as { last_success: number | null };
    return scheduled || needsImport(row.last_success, !!db.prepare("SELECT 1 FROM imdb_ratings LIMIT 1").get()) || needsTopRatedRefresh(db);
  });
  const daily = (dependencies.schedule ?? cron.schedule)(IMDB_CONFIG.schedule, () => controller.trigger(true), { timezone: "UTC", noOverlap: true, unref: true });
  const maintenance = setInterval(() => {
    try {
      getCache().maintain();
      db.prepare("DELETE FROM imdb_mappings WHERE expires_at<=?").run(Date.now());
      void controller.trigger();
    }
    catch { console.warn("Background database maintenance failed; will retry"); }
  }, 15 * 60_000);
  maintenance.unref();
  state.streamingScheduler = { stop() {
    void daily.destroy(); controller.stop(); clearInterval(maintenance); child?.kill();
    getCache().flushStats();
    state.streamingScheduler = undefined;
  } };
  process.once("exit", () => state.streamingScheduler?.stop());
  void controller.trigger();
  return state.streamingScheduler;
}
