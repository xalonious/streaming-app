import { getDatabase } from "../db/connection";
import { importRatings } from "./importer";
import { refreshImdbTopRated } from "./top-rated";
const db = getDatabase();
const parentDisconnected = () => process.exit(1);
if (process.send) process.on("disconnect", parentDisconnected);
async function maintain() {
  if (!process.argv.includes("--rankings-only")) {
    const result = await importRatings(db, { force: process.argv.includes("--force"), scheduled: process.argv.includes("--scheduled") });
    console.info("IMDb import:", result);
    if (result.status === "locked") return;
  }
  console.info("IMDb top-rated preparation:", await refreshImdbTopRated(db));
}
maintain().catch(error => {
  console.error("IMDb background maintenance failed:", error instanceof Error ? error.message || error.name : "Unknown error");
  process.exitCode = 1;
}).finally(() => {
  process.removeListener("disconnect", parentDisconnected);
  db.close(); process.disconnect?.();
});
