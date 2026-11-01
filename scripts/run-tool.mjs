import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
const [tool, ...args] = process.argv.slice(2);
if (tool !== "imdb-worker") throw new Error("Unknown maintenance command");
const path = `runtime/${tool}.cjs`;
if (!existsSync(path)) await import("./build-tools.mjs");
const child = spawn(process.execPath, ["--env-file-if-exists=.env.local", path, ...args], { stdio: "inherit", windowsHide: true });
child.once("error", error => { console.error(error.message); process.exitCode = 1; });
child.once("exit", code => { process.exitCode = code ?? 1; });
