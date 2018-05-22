import repl from "repl";
import core from "./core";
import { MalEnv } from "./env";
import { readString } from "./reader";
import { printString } from "./printer";
import { MalUnexceptedSyntax, MalParametersError, MalMultipleParametersError } from "./errors";
import {
    MalType, MalList, MalNumber, MalSymbol, MalFunction,
    MalBoolean, MalNil, Symbols, MalVector, MalHashMap, MalNativeFunction
} from "./types";
import {
    checkMalTypeIsMalSymbol, checkMalTypeIsMalList, checkMalInnerMultipleParameters,
    checkMalTypeIsMalVector, checkMalTypeIsMalType, checkMalInnerParameters, checkMalVectorLength,
    isMalHashMap, isMalVector, isPositive, isMalList, isMalSymbol, checkMalBindings
} from "./checker";


const ReplEnv: MalEnv = new MalEnv();
core.forEach((value: MalType, symbol: MalSymbol) => ReplEnv.set(symbol, value));

function READ(str: string): MalType {
    return readString(str);
}

function EVAL(ast: MalType, env: MalEnv): MalType {
    if (!isMalList(ast)) {
        return EVAL_AST(ast, env);
    } else {
        return EVAL_LIST(ast, env);
    }
}

function EVAL_LIST(ast: MalList, env: MalEnv): MalType {
    if (ast.length <= 0) {
        return MalNil.get();
    } else {
        const [symbol, ...args] = ast;
        checkMalTypeIsMalSymbol(symbol);
        switch (symbol) {
            case MalSymbol.get(Symbols.Def): return DEF(env, args);
            case MalSymbol.get(Symbols.Let): return LET(env, args);
            case MalSymbol.get(Symbols.Do): return DO(env, args);
            case MalSymbol.get(Symbols.If): return IF(env, args);
            case MalSymbol.get(Symbols.Fn): return FN(env, args);
            default: {
                const result = EVAL_AST(ast, env);
                checkMalTypeIsMalList(result);
                const [func, ...args] = result as MalList;
                return func.call(...args);
            }
        }
    }

    function DEF(env: MalEnv, args: Array<MalType>): MalType {
        checkMalInnerParameters(MalSymbol.get(Symbols.Def), args, 2);
        const [key, value] = args;
        checkMalTypeIsMalSymbol(key);
        return env.set(key as MalSymbol, EVAL(value, env));
    }

    function LET(env: MalEnv, args: Array<MalType>): MalType {
        checkMalInnerParameters(MalSymbol.get(Symbols.Let), args, 2);
        const [bindings, letAst] = args;
        checkMalTypeIsMalVector(bindings);
        const newEnv = new MalEnv(env);
        checkMalVectorLength(bindings as MalVector, 2);
        for (const [key, value] of (bindings as MalList).group(2)) {
            checkMalTypeIsMalSymbol(key);
            newEnv.set(key as MalSymbol, EVAL(value, newEnv));
        }
        return EVAL(letAst, newEnv);
    }

    function DO(env: MalEnv, args: Array<MalType>): MalType {
        checkMalInnerMultipleParameters(MalSymbol.get(Symbols.Do), args, 1);
        let results = args.map(arg => EVAL(arg, env));
        return results[results.length - 1];
    }

    function IF(env: MalEnv, args: Array<MalType>): MalType {
        if (args.length === 2) args.push(MalNil.get());
        checkMalInnerParameters(MalSymbol.get(Symbols.If), args, 3);
        const [condition, yes, no] = args;
        let result = EVAL(condition, env);
        return isPositive(result) ? EVAL(yes, env) : EVAL(no, env);
    }

    function FN(env: MalEnv, args: Array<MalType>): MalFunction {
        const funcSymbol = MalSymbol.get(Symbols.Fn);
        checkMalInnerParameters(funcSymbol, args, 2);
        const [bindings, ast] = args;
        checkMalBindings(funcSymbol, bindings);
        const fn = (...fnArgs: Array<MalType>) => EVAL(ast, new MalEnv(env, bindings as MalVector, new MalList(fnArgs)));
        return new MalFunction(ast, bindings as MalVector, env, fn);
    }
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

function PRINT(exp: MalType): string {
    return printString(exp);
}

function rep(str: string): string {
    return PRINT(EVAL(READ(str), ReplEnv));
}

function main() {
    function malEval(cmd: string, context: any, filename: string, callback: Function) {
        try {
            callback(null, rep(cmd))
        } catch (e) {
            callback(null, e.toString());
        }
    }

    repl.start({ prompt: '> ', eval: malEval, writer: (v: any) => v });
}

main();
