#!/usr/bin/env node
/**
 * Stage everything the desktop installer carries, for one target.
 *
 * The Tauri shell is a launcher: it starts the Node server and points a
 * webview at it. In a checkout both of those exist already. In an installed
 * app neither does, so this puts them where the bundle config
 * (`src-tauri/tauri.bundle.conf.json`) picks them up:
 *
 *   build/desktop/                         → $RESOURCE/app/
 *     server/{dist,web,skills,package.json} the built server, as `npm run build` leaves it
 *     server/node_modules/                  its production dependencies only
 *     README.md, docs/*.md, LICENSE         read by the assistant (server/src/llm/docs.ts)
 *   src-tauri/binaries/node-<triple>[.exe]  → next to the app's executable
 *
 * The layout mirrors the repo on purpose: the server finds its UI, catalogs,
 * skills and docs relative to its own files, so the same paths work in both.
 *
 * Two things are pinned to the bundled Node rather than to whatever Node runs
 * this script: the interpreter itself (downloaded, SHA-256 checked) and
 * better-sqlite3's native module, whose prebuilt binary is fetched for that
 * Node's ABI and the target's arch. A module built for the wrong ABI is the
 * classic way a packaged Node app dies on first launch.
 *
 *   node scripts/desktop-stage.mjs [--target <rust-triple>] [--skip-build]
 *
 * The target defaults to TAURI_ENV_TARGET_TRIPLE (set by `tauri build`) and
 * then to this machine's host triple.
 */

import { execFileSync, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The Node the app ships. Must be a major better-sqlite3 publishes prebuilds
 *  for; bump it deliberately, and with `engines` in mind. */
const NODE_VERSION = "22.23.3";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const stage = join(root, "build", "desktop");
const cache = join(root, "build", "cache");
const binaries = join(root, "src-tauri", "binaries");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const run = (cmd, cwd = root, env = process.env) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", shell: true, env });
};

function hostTriple() {
  const out = execFileSync("rustc", ["-vV"], { encoding: "utf8" });
  const line = out.split("\n").find((l) => l.startsWith("host:"));
  if (!line) throw new Error("Could not read the host triple from `rustc -vV`.");
  return line.slice("host:".length).trim();
}

/** Rust target triple → Node's dist naming and npm's arch. */
const TARGETS = {
  "x86_64-pc-windows-msvc": { dist: "win-x64", archive: "zip", exe: "node.exe", arch: "x64" },
  "aarch64-pc-windows-msvc": { dist: "win-arm64", archive: "zip", exe: "node.exe", arch: "arm64" },
  "aarch64-apple-darwin": { dist: "darwin-arm64", archive: "tar.gz", exe: "bin/node", arch: "arm64" },
  "x86_64-apple-darwin": { dist: "darwin-x64", archive: "tar.gz", exe: "bin/node", arch: "x64" },
  "x86_64-unknown-linux-gnu": { dist: "linux-x64", archive: "tar.xz", exe: "bin/node", arch: "x64" },
  "aarch64-unknown-linux-gnu": { dist: "linux-arm64", archive: "tar.xz", exe: "bin/node", arch: "arm64" },
};

const triple = option("--target") ?? process.env.TAURI_ENV_TARGET_TRIPLE ?? hostTriple();
const target = TARGETS[triple];
if (!target) {
  console.error(`No desktop packaging for ${triple}. Known: ${Object.keys(TARGETS).join(", ")}`);
  process.exit(1);
}
console.log(`Staging the desktop app for ${triple} with Node ${NODE_VERSION}`);

/* ------------------------------------------------------------ the server */

if (!flag("--skip-build")) run("node scripts/build.mjs");

const server = join(root, "server");
for (const required of ["dist/cli.js", "web/index.html"]) {
  if (!existsSync(join(server, required))) {
    console.error(`server/${required} is missing — run \`npm run build\` first.`);
    process.exit(1);
  }
}

rmSync(stage, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
const stagedServer = join(stage, "server");
mkdirSync(stagedServer, { recursive: true });
for (const dir of ["dist", "web", "skills"]) {
  cpSync(join(server, dir), join(stagedServer, dir), { recursive: true });
}
cpSync(join(root, "README.md"), join(stage, "README.md"));
cpSync(join(root, "LICENSE"), join(stage, "LICENSE"));
mkdirSync(join(stage, "docs"));
// Tracked docs only: the assistant quotes these to users, so a local draft
// sitting untracked in docs/ must not ride along into an installer.
let docs;
try {
  docs = execFileSync("git", ["ls-files", "docs"], { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .filter((p) => /^docs\/[^/]+\.md$/i.test(p))
    .map((p) => p.slice("docs/".length));
} catch {
  docs = readdirSync(join(root, "docs")).filter((name) => name.toLowerCase().endsWith(".md"));
}
for (const name of docs) cpSync(join(root, "docs", name), join(stage, "docs", name));

/*
 * Production dependencies, at the versions the root lockfile resolved. npm
 * workspaces hoist everything into the root node_modules, so there is no
 * server-only tree to copy; installing the pinned top-level set into the
 * stage is the honest equivalent.
 */
const serverPkg = JSON.parse(readFileSync(join(server, "package.json"), "utf8"));
const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
const pinned = Object.fromEntries(
  Object.keys(serverPkg.dependencies).map((name) => {
    const entry = lock.packages[`node_modules/${name}`] ?? lock.packages[`server/node_modules/${name}`];
    if (!entry?.version) throw new Error(`${name} is not in package-lock.json — run npm install.`);
    return [name, entry.version];
  }),
);
writeFileSync(
  join(stagedServer, "package.json"),
  JSON.stringify(
    {
      name: serverPkg.name,
      version: serverPkg.version,
      private: true,
      type: serverPkg.type,
      license: serverPkg.license,
      dependencies: pinned,
    },
    null,
    2,
  ),
);
run("npm install --omit=dev --no-audit --no-fund --no-package-lock", stagedServer, {
  ...process.env,
  // prebuild-install reads these: fetch better-sqlite3 for the Node and arch
  // we ship, not for the one running this script.
  npm_config_runtime: "node",
  npm_config_target: NODE_VERSION,
  npm_config_arch: target.arch,
  npm_config_target_arch: target.arch,
});
// The native module's sources are only needed to compile it, which the
// prebuild already did.
for (const leftover of ["deps", "src"]) {
  rmSync(join(stagedServer, "node_modules", "better-sqlite3", leftover), { recursive: true, force: true });
}
if (!existsSync(join(stagedServer, "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node"))) {
  console.error("better-sqlite3 has no native module for this target — no prebuild was found.");
  process.exit(1);
}

/* -------------------------------------------------------------- the Node */

const base = `https://nodejs.org/dist/v${NODE_VERSION}`;
const archiveName = `node-v${NODE_VERSION}-${target.dist}.${target.archive}`;
mkdirSync(cache, { recursive: true });
const archivePath = join(cache, archiveName);

async function fetchOk(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`GET ${url} → HTTP ${resp.status}`);
  return resp;
}

const sums = await (await fetchOk(`${base}/SHASUMS256.txt`)).text();
const expected = sums
  .split("\n")
  .map((l) => l.trim().split(/\s+/))
  .find(([, file]) => file === archiveName)?.[0];
if (!expected) throw new Error(`${archiveName} is not listed in SHASUMS256.txt`);

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
if (!existsSync(archivePath) || sha256(archivePath) !== expected) {
  console.log(`\nDownloading ${archiveName}`);
  writeFileSync(archivePath, Buffer.from(await (await fetchOk(`${base}/${archiveName}`)).arrayBuffer()));
}
if (sha256(archivePath) !== expected) {
  throw new Error(`${archiveName} does not match its published SHA-256 — refusing to ship it.`);
}

const unpacked = join(cache, `node-v${NODE_VERSION}-${target.dist}`);
rmSync(unpacked, { recursive: true, force: true });
// bsdtar (Windows 10+, macOS) reads zip as well as tarballs. On Windows it is
// named explicitly: a Git or MSYS `tar` earlier on PATH is GNU tar, which
// cannot open a zip and reads `C:` in a path as a remote host.
const tar =
  process.platform === "win32" ? join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe") : "tar";
execFileSync(tar, ["-xf", archivePath, "-C", cache], { stdio: "inherit" });

mkdirSync(binaries, { recursive: true });
const sidecar = join(binaries, `node-${triple}${target.exe.endsWith(".exe") ? ".exe" : ""}`);
cpSync(join(unpacked, target.exe), sidecar);
console.log(`\nStaged ${stage}\nStaged ${sidecar}`);
