import { build } from "esbuild";
await build({
  entryPoints: { "imdb-worker": "src/lib/server/imdb/worker.ts" },
  outdir: "runtime", outExtension: { ".js": ".cjs" }, bundle: true,
  platform: "node", target: "node20", format: "cjs", external: ["better-sqlite3"],
  plugins: [{ name: "server-only-cli", setup(build) {
    build.onResolve({ filter: /^server-only$/ }, () => ({ path: "server-only", namespace: "empty" }));
    build.onLoad({ filter: /.*/, namespace: "empty" }, () => ({ contents: "" }));
  } }],
});
