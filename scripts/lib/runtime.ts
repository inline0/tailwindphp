import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Layer from "effect/Layer";
import { commandLayer } from "./command.ts";

export const runtimeLayer = commandLayer.pipe(Layer.provideMerge(NodeServices.layer));
export type RuntimeServices = Layer.Success<typeof runtimeLayer>;
