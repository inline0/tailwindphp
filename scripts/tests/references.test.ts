import assert from "node:assert/strict";
import { test } from "node:test";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import { Command, type CommandCall } from "../lib/command.ts";
import { latestStableTag, updateReferences } from "../lib/references.ts";
import { loadReference } from "../lib/upstream.ts";

test("stable library tags sort numerically and exclude prereleases", () => {
  assert.equal(latestStableTag(["tailwind-merge@3.9.0", "tailwind-merge@3.10.0", "v4.0.0-beta.1", "random"]), "tailwind-merge@3.10.0");
  assert.equal(latestStableTag(["v1.0.0-beta"]), undefined);
});

test("version inspection never fetches, installs or changes references", async (t) => {
  t.mock.method(console, "log", () => {});
  const calls: CommandCall[] = [];
  const fs = FileSystem.makeNoop({ exists: () => Effect.succeed(true) });
  await Effect.runPromise(updateReferences("libs", { check: true, yes: false, target: "" }).pipe(
    Effect.provideService(FileSystem.FileSystem, fs),
    Effect.provideService(Command, { run: (call) => {
      calls.push(call);
      return Effect.succeed({ code: 0, stdout: call.args?.[0] === "describe" ? "v1.0.0\n" : "abc123\n", stderr: "" });
    } }),
  ));
  assert.equal(calls.length, 6);
  assert.ok(calls.every((call) => call.command === "git" && ["rev-parse", "describe"].includes(call.args![0]!)));
});

test("upstream source bundling preserves const enums and function names", async () => {
  const layer = (await import("../lib/runtime.ts")).runtimeLayer;
  const result = await Effect.runPromise(Effect.scoped(loadReference<{ named: () => number }>("const enum Value { Seven = 7 }; export function named() { return Value.Seven; }")).pipe(Effect.provide(layer)));
  assert.equal(result.named(), 7);
  assert.equal(result.named.name, "named");
});
