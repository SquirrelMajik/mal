import config from "./config";
import { MalEnv } from "./env";
import { MalType, MalError } from "./types";

export function printString(exp: MalType, readable: boolean = true): string {
  return exp.toString(readable);
}

export function exprString(exp: MalType): string {
  return exp.expr();
}

export function debugPrint(exp: MalType, readable: boolean = true) {
  if (config.debug) console.log(`Debug: ${printString(exp, readable)}`);
}

export function printError(error: MalError): void {
  console.log("\x1b[31m%s\x1b[0m", `\n${error.toString(false)}\n`);
}
