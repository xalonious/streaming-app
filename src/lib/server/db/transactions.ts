import "server-only";
import type { DatabaseSync } from "node:sqlite";

let savepointId = 0;

export function transaction<T>(db: DatabaseSync, action: () => T, mode: "DEFERRED" | "IMMEDIATE" = "DEFERRED"): T {
  const savepoint = db.isTransaction ? `streaming_${++savepointId}` : null;
  db.exec(savepoint ? `SAVEPOINT ${savepoint}` : `BEGIN ${mode}`);
  try {
    const result = action();
    if (result && typeof (result as { then?: unknown }).then === "function") {
      throw new TypeError("SQLite transaction callbacks must be synchronous");
    }
    db.exec(savepoint ? `RELEASE SAVEPOINT ${savepoint}` : "COMMIT");
    return result;
  } catch (error) {
    if (db.isTransaction) {
      if (savepoint) {
        db.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        db.exec(`RELEASE SAVEPOINT ${savepoint}`);
      } else db.exec("ROLLBACK");
    }
    throw error;
  }
}
