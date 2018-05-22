import repl from "repl";

import { MalType } from "types";
import { readString } from "./reader";
import { printString } from "./printer";

function READ(str: string): MalType {
  return readString(str);
}

function EVAL(ast: any): any {
  return ast;
}

function PRINT(exp: MalType): string {
  return printString(exp);
}

function rep(str: string): string {
  return str ? PRINT(EVAL(READ(str))) : str;
}

function main() {
  function malEval(
    cmd: string,
    context: any,
    filename: string,
    callback: Function
  ) {
    try {
      callback(null, rep(cmd.trim()));
    } catch (e) {
      console.error(e);
      callback(new repl.Recoverable(e));
    }
  }

  repl.start({ prompt: "> ", eval: malEval });
}

main();
