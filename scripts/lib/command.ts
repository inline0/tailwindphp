import * as Context from "effect/Context";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ChildProcess from "effect/process/ChildProcess";
import * as ChildProcessSpawner from "effect/process/ChildProcessSpawner";
import * as Runtime from "effect/Runtime";
import * as Stream from "effect/Stream";

export interface CommandCall {
  readonly command: string;
  readonly args?: ReadonlyArray<string>;
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly inherit?: boolean;
  readonly check?: boolean;
}
export interface CommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}
export class CommandFailure extends Data.TaggedError("CommandFailure")<{
  readonly message: string;
  readonly code: number;
}> {
  override get [Runtime.errorExitCode]() { return this.code; }
}
export class Command extends Context.Service<Command, {
  readonly run: (call: CommandCall) => Effect.Effect<CommandResult, CommandFailure>;
}>()("tooling/Command") {}

export const commandLayer = Layer.effect(Command, Effect.gen(function* () {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  return { run: (call: CommandCall) => Effect.scoped(Effect.gen(function* () {
    const child = yield* spawner.spawn(ChildProcess.make(call.command, [...(call.args ?? [])], {
      ...(call.cwd === undefined ? {} : { cwd: call.cwd }),
      ...(call.env === undefined ? {} : { env: { ...call.env } }),
      extendEnv: true,
      stdin: call.inherit ? "inherit" : "ignore",
      ...(call.inherit ? { stdout: "inherit" as const, stderr: "inherit" as const } : {}),
      forceKillAfter: "1 second",
    }));
    const [stdout, stderr, code] = call.inherit
      ? ["", "", yield* child.exitCode] as const
      : yield* Effect.all([
          Stream.mkString(Stream.decodeText(child.stdout)),
          Stream.mkString(Stream.decodeText(child.stderr)),
          child.exitCode,
        ], { concurrency: "unbounded" });
    const result = { stdout, stderr, code: Number(code) };
    if (call.check !== false && result.code !== 0) {
      return yield* Effect.fail(new CommandFailure({
        code: result.code,
        message: `${call.command} exited with ${result.code}${stderr.trim() ? `: ${stderr.trim()}` : ""}`,
      }));
    }
    return result;
  })).pipe(Effect.mapError((cause) => cause instanceof CommandFailure ? cause : new CommandFailure({
    code: 1, message: `${call.command}: ${cause.message}`,
  }))) };
}));
export const run = (call: CommandCall) => Command.use((service) => service.run(call));
