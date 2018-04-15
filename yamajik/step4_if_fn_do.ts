import repl from "repl";
import { readString } from "./reader";
import { printString } from "./printer";
import { MalType, MalList, MalNumber, MalSymbol, MalFunction, MalBoolean, MalNil, Symbols } from "./types";
import { MalEnv } from "./env";
import { checkMalTypeIsMalSymbol, checkMalTypeIsMalList } from "./checker";


const ReplEnv: MalEnv = new MalEnv();
ReplEnv.set(MalSymbol.get('+'), new MalFunction((x: any, y: any) => new MalNumber(x.value + y.value)));
ReplEnv.set(MalSymbol.get('-'), new MalFunction((x: any, y: any) => new MalNumber(x.value - y.value)));
ReplEnv.set(MalSymbol.get('*'), new MalFunction((x: any, y: any) => new MalNumber(x.value * y.value)));
ReplEnv.set(MalSymbol.get('/'), new MalFunction((x: any, y: any) => new MalNumber(x.value / y.value)));
ReplEnv.set(MalSymbol.get('//'), new MalFunction((x: any, y: any) => new MalNumber(Math.floor(x.value / y.value))));

function READ(str: string): MalType {
    return readString(str);
}

function EVAL(ast: MalType, env: MalEnv): any {
    if (!(ast instanceof MalList)) {
        return EVAL_AST(ast, env);
    } else if (ast.length <= 0) {
        return ast;
    } else {
        const symbol = ast.first();
        checkMalTypeIsMalSymbol(symbol);

        if (MalSymbol.get(Symbols.DEF).equal(symbol)) {
            const [, key, value] = ast.value;
            return DEF(env, key, value);
        } else if (MalSymbol.get(Symbols.LET).equal(symbol)) {
            const [, bindings, letAst] = ast.value;
            return LET(env, bindings, letAst);
        } else if (MalSymbol.get(Symbols.DO).equal(symbol)) {
            const [, ...args] = ast.value;
            return DO(env, args);
        } else if (MalSymbol.get(Symbols.IF).equal(symbol)) {
            const [, condition, yes, no] = ast.value;
            return IF(env, condition, yes, no);
        } else if (MalSymbol.get(Symbols.FN).equal(symbol)) {
            const [, params, bindings] = ast.value;
            return FN(env, params, bindings);
        } else {
            const [func, ...args] = ast.map(item => EVAL(item, env));
            return func.call(...args);
        }
    }

    function DEF(env: MalEnv, key: MalSymbol, value: MalType): MalType {
        checkMalTypeIsMalSymbol(key);
        return env.set(key, EVAL(value, env));
    }

    function LET(env: MalEnv, bindings: any, ast: MalType): MalType {
        checkMalTypeIsMalList(bindings);
        const newEnv = new MalEnv(env);
        for (const [key, value] of bindings.group(2)) {
            checkMalTypeIsMalSymbol(key);
            if (!key || !value) throw "Unexcepted Syntax";
            newEnv.set(key, EVAL_AST(value, newEnv));
        }
        return EVAL_AST(ast, newEnv);
    }

    function DO(env: MalEnv, args: Array<MalType>): MalType {
        let results = args.map(arg => EVAL(arg, env));
        return results[results.length - 1];
    }

    function IF(env: MalEnv, condition: MalType, yes: MalType, no: MalType): MalType {
        let result = EVAL_AST(condition, env);
        return isPositive(result) ? EVAL_AST(yes, env) : EVAL_AST(no, env);
    }

    function FN(env: MalEnv, params: any, bindings: MalType): MalFunction {
        checkMalTypeIsMalList(params);
        const symbols = params.map((param: MalType) => {
            checkMalTypeIsMalSymbol(param);
            return param;
        });
        return new MalFunction((...args: Array<MalType>) => {
            return EVAL(bindings, new MalEnv(env, symbols, args));
        });
    }

    function isPositive(value: MalType) {
        return !(value instanceof MalBoolean && value.value === false || value instanceof MalNil);
    }
}

function EVAL_AST(ast: MalType, env: MalEnv): MalType {
    if (ast instanceof MalSymbol) {
        return env.get(ast);
    } else if (ast instanceof MalList) {
        return new MalList(ast.map(item => EVAL(item, env)));
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
            callback(null, rep(cmd));
        } catch (e) {
            callback(null, e.toString());
        }
    }

    function malWriter(result: any) {
        return result;
    }

    repl.start({ prompt: '> ', eval: malEval, writer: malWriter });
}

main();
