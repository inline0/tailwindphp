#!/usr/bin/env node
import { main } from "./lib/cli.ts";
import { referenceCommand } from "./lib/references.ts";
export const command = referenceCommand("tailwind");
if (import.meta.main) main(command);
