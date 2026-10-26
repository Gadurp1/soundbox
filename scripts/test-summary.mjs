#!/usr/bin/env node
/**
 * Turn Vitest's JSON report into Markdown for the GitHub Actions run summary.
 *
 *   node scripts/test-summary.mjs <results.json> [title]
 *
 * Appends to $GITHUB_STEP_SUMMARY when it is set, else prints to stdout. A
 * missing report (tests crashed before writing it) is said plainly rather
 * than failing the step: the test step has already failed the job.
 */

import { appendFileSync, readFileSync } from "node:fs";
import { relative } from "node:path";

const [file, title = "Tests"] = process.argv.slice(2);
if (!file) {
  console.error("usage: test-summary.mjs <results.json> [title]");
  process.exit(2);
}

function emit(md) {
  const out = process.env.GITHUB_STEP_SUMMARY;
  if (out) appendFileSync(out, md + "\n");
  else process.stdout.write(md + "\n");
}

let report;
try {
  report = JSON.parse(readFileSync(file, "utf8"));
} catch {
  emit(`## ${title}\n\nNo report at \`${file}\`: the test run ended before writing one.`);
  process.exit(0);
}

const cell = (s) => String(s).replace(/[\\|]/g, "\\$&").replace(/\r?\n/g, " ");
const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
const root = process.cwd();

const files = report.testResults.map((f) => {
  const tests = f.assertionResults;
  const count = (status) => tests.filter((t) => t.status === status).length;
  return {
    name: relative(root, f.name).replace(/\\/g, "/"),
    passed: count("passed"),
    failed: count("failed"),
    skipped: tests.length - count("passed") - count("failed"),
    ms: (f.endTime ?? 0) - (f.startTime ?? 0),
    // A file can fail with no failed test in it (an import error, say).
    error: f.status === "failed" && count("failed") === 0 ? f.message : null,
    failures: tests.filter((t) => t.status === "failed"),
  };
});

const failedFiles = files.filter((f) => f.failed > 0 || f.error);
const skipped = report.numPendingTests + (report.numTodoTests ?? 0);
const total = files.reduce((ms, f) => ms + f.ms, 0);
const ok = report.success && failedFiles.length === 0;

const lines = [
  `## ${ok ? "✅" : "❌"} ${title}`,
  "",
  `**${report.numPassedTests} passed**, **${report.numFailedTests} failed**, ${skipped} skipped` +
    ` — ${report.numTotalTests} tests in ${files.length} files, ${seconds(total)} of test time.`,
  "",
];

if (failedFiles.length) {
  lines.push("### Failures", "");
  for (const f of failedFiles) {
    if (f.error) lines.push(`- \`${f.name}\`: ${cell(f.error.split("\n")[0])}`);
    for (const t of f.failures) {
      const reason = (t.failureMessages?.[0] ?? "").split("\n")[0];
      lines.push(`- \`${f.name}\` › ${cell(t.fullName)}${reason ? `: ${cell(reason)}` : ""}`);
    }
  }
  lines.push("");
}

lines.push(
  "<details><summary>Per file</summary>",
  "",
  "| File | Passed | Failed | Skipped | Time |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...files
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((f) => {
      const mark = f.failed || f.error ? "❌ " : "";
      return `| ${mark}\`${f.name}\` | ${f.passed} | ${f.failed} | ${f.skipped} | ${seconds(f.ms)} |`;
    }),
  "",
  "</details>",
  "",
  "The JUnit XML and the HTML report are in this run's `test-report` artifact." +
    " The HTML report loads its data with fetch, so serve it rather than opening the file:" +
    " unzip, then `npx vite preview --outDir html`.",
);

emit(lines.join("\n"));
