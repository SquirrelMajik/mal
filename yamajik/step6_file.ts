import repl from "repl";

import core from "./core";
import { MalEnv } from "./env";
import { readString } from "./reader";
import { printString } from "./printer";
import {
  MalUnexceptedSyntax,
  MalParametersError,
  MalMultipleParametersError
} from "./errors";
import {
  MalType,
  MalList,
  MalNumber,
  MalSymbol,
  MalFunction,
  MalBoolean,
  MalNil,
  Symbols,
  MalVector,
  MalHashMap,
  MalString
} from "./types";
import {
  checkMalTypeIsMalSymbol,
  checkMalTypeIsMalList,
  checkMalInnerMultipleParameters,
  checkMalTypeIsMalType,
  checkMalInnerParameters,
  checkMalSequentialBaseLength,
  isMalHashMap,
  isMalVector,
  isPositive,
  isMalList,
  isMalSymbol,
  isMalFunction,
  isMalNativeFunction,
  checkMalBindings,
  checkMalTypeIsMalSequential
} from "./checker";

const GlobalEnv: MalEnv = new MalEnv();
core.forEach((value: MalType, symbol: MalSymbol) =>
  GlobalEnv.set(symbol, value)
);

rep(
  '(def! load_file (fn* (path) (eval (read_str (str "(do " (slurp path) ")")))))'
);
load("globals.lisp");

function READ(str: string): MalType {
  return readString(str);
}

function EVAL_AST(ast: MalType, env: MalEnv): MalType {
  if (isMalSymbol(ast)) {
    return env.get(ast);
  } else if (isMalList(ast)) {
    return new MalList(ast.map((item: MalType) => EVAL(item, env)));
  } else if (isMalVector(ast)) {
    return new MalVector(ast.map((item: MalType) => EVAL(item, env)));
  } else if (isMalHashMap(ast)) {
    const mapList: Array<[MalType, MalType]> = [];
    for (const [key, value] of ast) {
      mapList.push([key, EVAL(value, env)]);
    }
    return new MalHashMap(mapList);
  } else {
    return ast;
  }
}

function EVAL(ast: MalType, env: MalEnv): MalType {
  loop: while (true) {
    if (!isMalList(ast)) {
      return EVAL_AST(ast, env);
    }
    if (ast.length <= 0) {
      return MalNil.get();
    } else {
      if (isMalSymbol(ast.first())) {
        const [symbol, ...args] = ast;
        switch (symbol) {
          case MalSymbol.get(Symbols.Def):
            return DEF(env, args);
          case MalSymbol.get(Symbols.Let):
            [ast, env] = LET(env, args);
            continue loop;
          case MalSymbol.get(Symbols.Do):
            ast = DO(env, args);
            continue loop;
          case MalSymbol.get(Symbols.If):
            ast = IF(env, args);
            continue loop;
          case MalSymbol.get(Symbols.Fn):
            return FN(env, args);
          case MalSymbol.get(Symbols.Eval):
            ast = EVALFUNC(env, args);
            continue loop;
        }
      }
      const result = EVAL_AST(ast, env);
      checkMalTypeIsMalList(result);
      const [func, ...params] = result as MalList;
      if (isMalFunction(func)) {
        ast = func.ast;
        env = new MalEnv(func.env, func.params, new MalList(params));
        continue loop;
      }
      return func.call(...params);
    }
  }
}

function DEF(env: MalEnv, args: Array<MalType>): MalType {
  checkMalInnerParameters(MalSymbol.get(Symbols.Def), args, 2);
  const [key, value] = args;
  checkMalTypeIsMalSymbol(key);
  return env.set(key as MalSymbol, EVAL(value, env));
}

function LET(env: MalEnv, args: Array<MalType>): [MalType, MalEnv] {
  checkMalInnerParameters(MalSymbol.get(Symbols.Let), args, 2);
  const [bindings, letAst] = args;
  checkMalTypeIsMalSequential(bindings);
  const newEnv = new MalEnv(env);
  checkMalSequentialBaseLength(bindings as MalVector, 2);
  for (const [key, value] of (bindings as MalList).group(2)) {
    checkMalTypeIsMalSymbol(key);
    newEnv.set(key as MalSymbol, EVAL(value, newEnv));
  }
  return [letAst, newEnv];
}

function DO(env: MalEnv, args: Array<MalType>): MalType {
  checkMalInnerMultipleParameters(MalSymbol.get(Symbols.Do), args, 1);
  let results = EVAL_AST(new MalList(args), env);
  return (results as MalList).last();
}

function IF(env: MalEnv, args: Array<MalType>): MalType {
  if (args.length === 2) args.push(MalNil.get());
  checkMalInnerParameters(MalSymbol.get(Symbols.If), args, 3);
  const [condition, yes, no] = args;
  let result = EVAL(condition, env);
  return isPositive(result) ? yes : no;
}

function FN(env: MalEnv, args: Array<MalType>): MalFunction {
  const funcSymbol = MalSymbol.get(Symbols.Fn);
  checkMalInnerParameters(funcSymbol, args, 2);
  const [bindings, ast] = args;
  checkMalBindings(funcSymbol, bindings);
  const fn = (...fnArgs: Array<MalType>) =>
    EVAL(ast, new MalEnv(env, bindings as MalVector, new MalList(fnArgs)));
  return new MalFunction(ast, bindings as MalVector, env, fn);
}

function EVALFUNC(env: MalEnv, args: Array<MalType>): MalType {
  checkMalInnerParameters(MalSymbol.get(Symbols.Eval), args, 1);
  const [ast] = args;
  return EVAL(ast, env);
}

function PRINT(exp: MalType): string {
  return printString(exp);
}

function rep(str: string): string {
  return PRINT(EVAL(READ(str), GlobalEnv));
}

function load(path: string): string {
  return rep(`(load_file "${path}")`);
}

function main() {
  const [node, enter, path, ...argv] = process.argv;
  GlobalEnv.set(
    MalSymbol.get(Symbols.Argv),
    new MalVector(argv.map(arg => new MalString(arg)))
  );
  if (!path) {
    repl.start({ prompt: "> ", eval: malEval, writer: (v: any) => v });
  } else {
    load(path);
  }

  function malEval(
    cmd: string,
    context: any,
    filename: string,
    callback: Function
  ) {
    try {
      callback(null, rep(cmd));
    } catch (e) {
      callback(null, e.toString());
    }
  }
}

main();
