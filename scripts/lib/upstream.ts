import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import { context, stop } from "esbuild";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import { attempt, promise } from "./cli.ts";

export const readReferenceVersion = (referencePackage: string) => Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const text = yield* fs.readFileString(fileURLToPath(new URL(`../../${referencePackage}`, import.meta.url)));
  return yield* attempt(() => (JSON.parse(text) as { version: string }).version);
});

// Upstream uses extensionless imports and const enums. Bundle that source in a
// scoped temporary directory; owned scripts remain native Node TypeScript.
export const loadReference = <A>(source: string) => Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const directory = yield* fs.makeTempDirectoryScoped({ prefix: "tailwindphp-reference-" });
  const bundler = yield* Effect.acquireRelease(promise(() => context({
    stdin: { contents: source, resolveDir: fileURLToPath(new URL("../..", import.meta.url)), loader: "ts" },
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node26",
    keepNames: true,
    write: false,
    logLevel: "silent",
  })), (value) => Effect.promise(async () => { await value.cancel(); await value.dispose(); stop(); }));
  const result = yield* promise(() => bundler.rebuild());
  const path = join(directory, "reference.mjs");
  yield* fs.writeFileString(path, result.outputFiles![0]!.text);
  return yield* promise(() => import(pathToFileURL(path).href) as Promise<A>);
});
