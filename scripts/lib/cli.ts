import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as Cause from "effect/Cause";
import * as CliError from "effect/cli/CliError";
import * as Cli from "effect/cli/Command";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Runtime from "effect/Runtime";
import { runtimeLayer, type RuntimeServices } from "./runtime.ts";

export class ScriptExit extends Data.TaggedError("ScriptExit")<{
  readonly code: number;
  readonly message: string;
}> {
  override get [Runtime.errorExitCode]() { return this.code; }
}
export const fail = (message: string, code = 1) => Effect.fail(new ScriptExit({ code, message }));
export const attempt = <A>(body: () => A) => Effect.try({
  try: body,
  catch: (cause) => new ScriptExit({ code: 1, message: cause instanceof Error ? cause.message : String(cause) }),
});
export const promise = <A>(body: (signal: AbortSignal) => PromiseLike<A>) => Effect.tryPromise({
  try: body,
  catch: (cause) => new ScriptExit({ code: 1, message: cause instanceof Error ? cause.message : String(cause) }),
});
export const exitCodeOf = (cause: Cause.Cause<unknown>): number => {
  if (Cause.hasInterruptsOnly(cause)) return 130;
  const error = Option.getOrUndefined(Cause.findErrorOption(cause));
  if (CliError.isCliError(error)) return 2;
  process.stderr.write(`${error instanceof Error ? error.message : Cause.pretty(cause)}\n`);
  return error === undefined ? 1 : Runtime.getErrorExitCode(error);
};
export const runProgram = <A, E>(program: Effect.Effect<A, E, RuntimeServices>) =>
  program.pipe(Effect.provide(runtimeLayer), Effect.as(0), Effect.catchCause((cause) => Effect.sync(() => exitCodeOf(cause))));
export const runMain = <A, E>(program: Effect.Effect<A, E, RuntimeServices>) => NodeRuntime.runMain(
  runProgram(program).pipe(Effect.flatMap((code) => code === 0 ? Effect.void : Effect.fail(new ScriptExit({ code, message: "" })))),
  { disableErrorReporting: true },
);
export const main = <Name extends string, Input, Context, E>(command: Cli.Command<Name, Input, Context, E, RuntimeServices>) =>
  runMain(Cli.runWith(command, { version: "1" })(process.argv.slice(2)));
