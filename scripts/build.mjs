#!/usr/bin/env node
/**
 * Build the frontend and server, and stage the UI where the server serves it
 * from.
 *
 * After this runs, `node server/dist/cli.js` (or `npm start --workspace
 * server`) serves the whole app on one port — no separate dev tooling
 * involved, which is what you want for a release. Use `npm run dev` for
 * hot-reload development instead.
 */

import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appDir = join(root, "app");
const serverDir = join(root, "server");
const dist = join(appDir, "dist");
const target = join(serverDir, "web");

const run = (cmd, cwd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", shell: true });
};

// npm workspaces hoist dependencies to the root node_modules. Running
// `npm ci` inside app/ would wipe and rebuild that shared tree, so a missing
// install is an error to fix at the root rather than something to paper over.
if (!existsSync(join(root, "node_modules"))) {
  console.error("\nNo node_modules at the repository root. Run `npm install` there first.");
  process.exit(1);
}

run("npx tsc --noEmit -p tsconfig.app.json", appDir);
run("npm run build", appDir);

if (!existsSync(dist)) {
  console.error(`\nBuild produced no output at ${dist}`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(dist, target, { recursive: true });

console.log(`\nStaged UI -> ${target}`);

run("npm run build", serverDir);

console.log("\nRun `npm start --workspace server` and open http://127.0.0.1:17494\n");
