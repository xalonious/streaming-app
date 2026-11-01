import { getDatabase } from "../db/connection";
import { importRatings } from "./importer";
const db = getDatabase();
const parentDisconnected = () => process.exit(1);
if (process.send) process.on("disconnect", parentDisconnected);
importRatings(db, { force: process.argv.includes("--force"), scheduled: process.argv.includes("--scheduled") }).then(result => {
  console.info("IMDb import:", result);
  process.removeListener("disconnect", parentDisconnected);
  db.close(); process.disconnect?.();
}).catch(error => {
  console.error("IMDb import failed:", error instanceof Error ? error.message || error.name : "Unknown error");
  process.removeListener("disconnect", parentDisconnected);
  db.close(); process.exitCode = 1; process.disconnect?.();
});
