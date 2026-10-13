#!/usr/bin/env node
// Start the server and the Vite dev server together, and stop both together.
//
// Without this, `npm run dev` only started Vite, and the server had to be
// launched by hand — which is how "the UI shows no models" happens: Vite is
// up, its proxy target on 17494 is not, and every /api call 502s.
//
// Usage:
//   npm run dev                 # server on 17494 + Vite on 5174
//   SOUNDBOX_DATA_DIR=... npm run dev
//   SOUNDBOX_AUDIOCPP_BACKEND=cpu npm run dev   # force a backend if auto-detect guesses wrong

import { spawn } from "node:child_process";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const serverDir = join(root, "server");
const isWin = process.platform === "win32";

const port = process.env.SOUNDBOX_PORT || "17494";

const children = [];
function run(name, cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: isWin && cmd.endsWith(".cmd"),
    ...opts,
  });
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`\n[dev] ${name} exited (${signal ?? code}); stopping the other.`);
    shutdown(code ?? 1);
  });
  children.push(child);
  return child;
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const c of children) {
    try {
      c.kill();
    } catch {}
  }
  setTimeout(() => process.exit(code), 300);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(`[dev] server: tsx watch src/cli.ts --port ${port}`);
run(
  "server",
  isWin ? "npx.cmd" : "npx",
  ["tsx", "watch", "src/cli.ts", "--port", port],
  { cwd: serverDir },
);

console.log("[dev] frontend: vite");
run("frontend", isWin ? "npm.cmd" : "npm", ["--prefix", join(root, "app"), "run", "dev"], {
  cwd: root,
});
