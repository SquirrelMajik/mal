import repl from "repl";
import core from "./core";
import { MalEnv } from "./env";
import { readString } from "./reader";
import { printString } from "./printer";
import { MalUnexceptedSyntax, MalParametersError, MalMultipleParametersError } from "./errors";
import {
    MalType, MalList, MalNumber, MalSymbol, MalFunction,
    MalBoolean, MalNil, Symbols, MalVector, MalHashMap, MalString
} from "./types";
import {
    checkMalTypeIsMalSymbol, checkMalTypeIsMalList, checkMalInnerMultipleParameters,
    checkMalTypeIsMalVector, checkMalTypeIsMalType, checkMalInnerParameters, checkMalVectorLength,
    isMalHashMap, isMalVector, isPositive, isMalList, isMalSymbol, isMalFunction, isMalNativeFunction, checkMalTypeIsMalVectorOrMalList
} from "./checker";


const GlobalEnv: MalEnv = new MalEnv();
core.forEach((value: MalType, symbol: MalSymbol) => GlobalEnv.set(symbol, value));

rep('(def! load-file (fn* (path) (eval (read-str (str "(do " (slurp path) ")")))))');
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
            mapList.push([key, EVAL(value, env)])
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
        } if (ast.length <= 0) {
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
                    case MalSymbol.get(Symbols.Quote):
                        return QUOTE(env, args);
                    case MalSymbol.get(Symbols.Quasiquote):
                        ast = QUASIQUOTE(env, args);
                        continue loop;
                }
            }
            const result = EVAL_AST(ast, env);
            checkMalTypeIsMalList(result);
            const [func, ...params] = result as MalList;
            if (isMalFunction(func)) {
                ast = func.ast;
                env = new MalEnv(func.env, func.params, params);
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
    checkMalTypeIsMalVector(bindings);
    const newEnv = new MalEnv(env);
    checkMalVectorLength(bindings as MalVector, 2);
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
    checkMalInnerParameters(MalSymbol.get(Symbols.If), args, 2);
    const [symbols, ast] = args;
    checkMalTypeIsMalVector(symbols);
    (symbols as MalVector).forEach(checkMalTypeIsMalSymbol);
    const params = (symbols as MalVector).map((sym: MalSymbol) => sym as MalSymbol);
    const fn = (...fnArgs: Array<MalType>) => EVAL(ast, new MalEnv(env, params, fnArgs));
    return new MalFunction(ast, params, env, fn);
}

function EVALFUNC(env: MalEnv, args: Array<MalType>): MalType {
    checkMalInnerParameters(MalSymbol.get(Symbols.Eval), args, 1);
    const [ast] = args;
    return EVAL(ast, env);
}

function QUOTE(env: MalEnv, args: Array<MalType>): MalType {
    checkMalInnerParameters(MalSymbol.get(Symbols.Quote), args, 1);
    return args[0];
}

function QUASIQUOTE(env: MalEnv, args: Array<MalType>): MalType {
    checkMalInnerParameters(MalSymbol.get(Symbols.Quasiquote), args, 1);
    const [ast] = args;
    if (!isMalList(ast) || ast.length < 1) {
        return new MalList([MalSymbol.get(Symbols.Quote), ast]);
    }

    const [ast1, ...astRest] = ast;
    if (MalSymbol.get(Symbols.Unquote).equal(ast1)) {
        checkMalInnerParameters(MalSymbol.get(Symbols.Unquote), astRest, 1);
        return astRest[0];
    }

    if (isMalList(ast1) && ast1.length > 0) {
        const [ast11, ...ast1Rest] = ast1 as MalList;
        if (MalSymbol.get(Symbols.SpliceUnquote).equal(ast11)) {
            checkMalInnerParameters(MalSymbol.get(Symbols.SpliceUnquote), ast1Rest, 1);
            const [ast12] = ast1Rest;
            return new MalList([
                MalSymbol.get(Symbols.Concat),
                ast12,
                QUASIQUOTE(env, [new MalList(astRest)])
            ]);
        }
    }

    return new MalList([
        MalSymbol.get(Symbols.Cons),
        QUASIQUOTE(env, [ast1]),
        QUASIQUOTE(env, [new MalList(astRest)])
    ]);
}

function PRINT(exp: MalType): string {
    return printString(exp);
}

function rep(str: string): string {
    return PRINT(EVAL(READ(str), GlobalEnv));
}

function load(path: string): string {
    return rep(`(load-file "${path}")`);
}

function main(): void {
    const [node, enter, path, ...argv] = process.argv;
    GlobalEnv.set(MalSymbol.get(Symbols.Argv), new MalVector(argv.map(arg => new MalString(arg))));
    if (!path) {
        repl.start({ prompt: '> ', eval: malEval, writer: (v: any) => v });
    } else {
        load(path);
    }

    function malEval(cmd: string, context: any, filename: string, callback: Function) {
        try {
            callback(null, rep(cmd))
        } catch (e) {
            callback(null, e.toString());
        }
    }
}

main();
