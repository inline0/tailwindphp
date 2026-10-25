import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import * as Effect from "effect/Effect";
import { run, CommandFailure } from "../lib/command.ts";
import { runtimeLayer } from "../lib/runtime.ts";
import { validateDocumentation } from "../check-docs-content.ts";

test("subprocess gateway drains both streams and preserves failure status", async () => {
  const result = await Effect.runPromise(run({ command: process.execPath, args: ["-e", "process.stdout.write('ok');process.stderr.write('problem');process.exit(7)"], check: false }).pipe(Effect.provide(runtimeLayer)));
  assert.deepEqual(result, { code: 7, stdout: "ok", stderr: "problem" });
  const error = await Effect.runPromise(run({ command: process.execPath, args: ["-e", "process.exit(9)"] }).pipe(Effect.flip, Effect.provide(runtimeLayer)));
  assert.ok(error instanceof CommandFailure);
  assert.equal(error.code, 9);
});

test("interruption closes the subprocess scope", async () => {
  const directory = mkdtempSync(join(tmpdir(), "tooling-child-"));
  const path = join(directory, "pid");
  try {
    await Effect.runPromise(run({ command: process.execPath, args: ["-e", `require('node:fs').writeFileSync(${JSON.stringify(path)},String(process.pid));setInterval(()=>{},1000)`] }).pipe(Effect.timeoutOption("500 millis"), Effect.provide(runtimeLayer)));
    const pid = Number(readFileSync(path, "utf8"));
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("documentation rejects unreachable pages and malformed navigation", () => {
  const root = "/fixture/docs";
  const page = "---\ntitle: One\ndescription: One\npath: /one\norder: 0\nmeta_title: One\nmeta_description: One\n---\n# One\n";
  const snapshot = { contents: new Map([[join(root, "one.md"), page], [join(root, "meta.json"), '{"pages":["missing"]}']]), directories: new Set([root]) };
  const report = validateDocumentation({ root, expectedDocs: 1, expectedNav: 1 }, snapshot);
  assert.ok(report.problems.some((message) => message.includes("unresolved navigation entry")));
  assert.ok(report.problems.some((message) => message.includes("document is unreachable")));
});

test("CLI distinguishes help, usage and validation failures", async () => {
  const call = (args: readonly string[]) => Effect.runPromise(run({ command: process.execPath, args: ["scripts/check-docs-content.ts", ...args], check: false }).pipe(Effect.provide(runtimeLayer)));
  const help = await call(["--help"]);
  assert.equal(help.code, 0);
  assert.match(help.stdout + help.stderr, /expected-docs/);
  const usage = await call(["--unknown-option"]);
  assert.equal(usage.code, 2);
  const missing = await call(["--root", "/missing-tooling-documentation-root"]);
  assert.equal(missing.code, 1);
  assert.equal(missing.stdout, "");
  assert.match(missing.stderr, /Could not resolve/);
});
