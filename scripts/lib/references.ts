import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import * as Argument from "effect/cli/Argument";
import * as Cli from "effect/cli/Command";
import * as Flag from "effect/cli/Flag";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import { fail, promise } from "./cli.ts";
import { run } from "./command.ts";

export type ReferenceKind = "tailwind" | "libs" | "plugins";
export interface Reference {
  readonly name: string;
  readonly path: string;
  readonly tags: string;
  readonly extract: readonly string[];
}
const root = fileURLToPath(new URL("../..", import.meta.url));
export const references: Readonly<Record<ReferenceKind, readonly Reference[]>> = {
  tailwind: [{ name: "tailwindcss", path: "reference/tailwindcss", tags: "v4.*", extract: ["composer", "extract"] }],
  libs: [
    { name: "clsx", path: "reference/clsx", tags: "v*", extract: ["php", "test-coverage/lib/extract-clsx-tests.php"] },
    { name: "tailwind-merge", path: "reference/tailwind-merge", tags: "*", extract: ["php", "test-coverage/lib/extract-tailwind-merge-tests.php"] },
  ],
  plugins: [
    { name: "typography", path: "reference/tailwindcss-typography", tags: "v*", extract: ["php", "test-coverage/plugins/typography/extract-tests.php"] },
    { name: "forms", path: "reference/tailwindcss-forms", tags: "v*", extract: ["php", "test-coverage/plugins/forms/extract-tests.php"] },
  ],
};
const git = (reference: Reference, args: readonly string[], check = true) => run({ command: "git", args, cwd: join(root, reference.path), check });
export const currentVersion = (reference: Reference) => Effect.gen(function* () {
  const commit = (yield* git(reference, ["rev-parse", "HEAD"])).stdout.trim();
  let tag = yield* git(reference, ["describe", "--tags", "--exact-match"], false);
  if (tag.code !== 0) tag = yield* git(reference, ["describe", "--tags", "--abbrev=0"], false);
  const branch = (yield* git(reference, ["rev-parse", "--abbrev-ref", "HEAD"])).stdout.trim();
  return { commit, tag: tag.stdout.trim() || "unknown", branch };
});
export const latestStableTag = (tags: readonly string[]) => tags.map((tag) => ({ tag, version: /^(?:v|tailwind-merge@)(\d+)\.(\d+)\.(\d+)$/.exec(tag)?.slice(1).map(Number) }))
  .filter((item): item is { tag: string; version: number[] } => item.version !== undefined)
  .sort((a, b) => a.version[0]! - b.version[0]! || a.version[1]! - b.version[1]! || a.version[2]! - b.version[2]!).at(-1)?.tag;
const confirm = () => Effect.scoped(Effect.gen(function* () {
  const terminal = yield* Effect.acquireRelease(Effect.sync(() => createInterface({ input: process.stdin, output: process.stdout })), (value) => Effect.sync(() => value.close()));
  return (yield* promise((signal) => terminal.question("Continue? [y/N] ", { signal }))).trim().toLowerCase() === "y";
}));
export interface UpdateInput { readonly target: string; readonly check: boolean; readonly yes: boolean }
export const updateReferences = (kind: ReferenceKind, input: UpdateInput) => Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  let selected = references[kind];
  if (kind !== "tailwind" && input.target) {
    selected = selected.filter((reference) => reference.name === input.target);
    if (selected.length === 0) return yield* fail(`Unknown ${kind === "libs" ? "library" : "plugin"} '${input.target}'. Available: ${references[kind].map((reference) => reference.name).join(", ")}`, 1);
  }
  const installed: Reference[] = [];
  for (const reference of selected) {
    if (!(yield* fs.exists(join(root, reference.path)))) { yield* Effect.sync(() => console.log(`${reference.name}: not installed`)); continue; }
    installed.push(reference);
    const current = yield* currentVersion(reference);
    yield* Effect.sync(() => console.log(`${reference.name}\n  Tag:    ${current.tag}\n  Commit: ${current.commit}\n  Branch: ${current.branch}`));
  }
  if (input.check) return;
  const updates: Array<{ reference: Reference; from: string; target: string }> = [];
  for (const reference of installed) {
    const current = yield* currentVersion(reference);
    let target = kind === "tailwind" ? input.target : "";
    if (!target) {
      yield* git(reference, ["fetch", "--tags"]);
      const tags = (yield* git(reference, ["tag", "--list", reference.tags, "--sort=version:refname"])).stdout.trim().split("\n").filter(Boolean);
      target = kind === "libs" ? latestStableTag(tags) ?? "" : tags.at(-1) ?? "";
    }
    if (!target) return yield* fail(`Could not determine latest tag for ${reference.name}.`);
    if (current.tag === target && kind !== "tailwind") { yield* Effect.sync(() => console.log(`${reference.name}: already at ${target}`)); continue; }
    updates.push({ reference, from: current.tag, target });
  }
  if (updates.length === 0) { yield* Effect.sync(() => console.log("All references are up to date!")); return; }
  yield* Effect.sync(() => {
    console.log("This will update references, regenerate their data and run the test suite:");
    for (const { reference, from, target } of updates) console.log(`  ${reference.name}: ${from} -> ${target}`);
  });
  if (!input.yes && !(yield* confirm())) { yield* Effect.sync(() => console.log("Aborted.")); return; }
  for (const { reference, target } of updates) {
    yield* git(reference, ["fetch", "--all", "--tags"]);
    yield* git(reference, ["checkout", target]);
    const version = yield* currentVersion(reference);
    if (kind === "tailwind") {
      yield* fs.makeDirectory(join(root, "resources"), { recursive: true });
      for (const file of ["theme.css", "preflight.css", "utilities.css", "index.css"]) {
        const source = join(root, reference.path, "packages/tailwindcss", file);
        if (yield* fs.exists(source)) yield* fs.copyFile(source, join(root, "resources", file));
        else yield* Effect.sync(() => console.log(`Source not found: ${file}`));
      }
    }
    if (reference.name === "tailwind-merge") yield* run({ command: process.execPath, args: [join(root, "scripts/generate-tailwind-merge.ts")], cwd: root, inherit: true });
    const [executable, ...args] = reference.extract;
    if (executable === "composer" || (args[0] && (yield* fs.exists(join(root, args[0]))))) yield* run({ command: executable!, args, cwd: root, inherit: true });
    else yield* Effect.sync(() => console.log(`${reference.name}: no extraction script found`));
    if (kind !== "plugins") {
      const readmePath = join(root, "README.md");
      const readme = yield* fs.readFileString(readmePath);
      const badgeName = reference.name === "tailwindcss" ? "TailwindCSS" : reference.name === "tailwind-merge" ? "tailwind--merge" : reference.name;
      yield* fs.writeFileString(readmePath, readme.replace(new RegExp(`${badgeName}-v[\\d.]+-`, "g"), `${badgeName}-${version.tag}-`));
    }
  }
  const args = kind === "tailwind" ? ["test"] : kind === "libs" ? ["test-libs"] : ["test-plugins"];
  yield* run({ command: "composer", args, cwd: root, inherit: true });
  yield* Effect.sync(() => console.log("Update successful. Review and commit the reference and generated changes."));
});
export const referenceCommand = (kind: ReferenceKind) => Cli.make(`update-${kind === "tailwind" ? "tailwind" : kind}`, {
  target: Argument.String(kind === "tailwind" ? "tag-or-commit" : kind === "libs" ? "library" : "plugin").pipe(Argument.withDefault("")),
  check: Flag.Boolean("check").pipe(Flag.withAlias("c"), Flag.withDefault(false)),
  yes: Flag.Boolean("yes").pipe(Flag.withDefault(false)),
}, (input) => updateReferences(kind, input)).pipe(Cli.withDescription("Update pinned upstream references, regenerate expectations and run their PHP tests."));
