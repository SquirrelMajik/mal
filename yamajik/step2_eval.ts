import repl from 'repl';
import { readString } from './reader';
import { printString } from './printer';
import { MalType, MalList, MalNumber, MalSymbol, MalFunction } from './types';

interface MalEnv {
    [key: string]: MalFunction;
}

const ReplEnv: MalEnv = {
    "+": new MalFunction((x: any, y: any) => new MalNumber(x.value + y.value)),
    "-": new MalFunction((x: any, y: any) => new MalNumber(x.value - y.value)),
    "*": new MalFunction((x: any, y: any) => new MalNumber(x.value * y.value)),
    "/": new MalFunction((x: any, y: any) => new MalNumber(x.value / y.value)),
    "//": new MalFunction((x: any, y: any) => new MalNumber(Math.floor(x.value / y.value)))
}

function READ(str: string): MalType {
    return readString(str);
}

function EVAL(ast: MalType, env: MalEnv): any {
    if (!(ast instanceof MalList)) {
        return EVAL_AST(ast, env);
    } else if (ast.length <= 0) {
        return ast;
    } else {
        const [symbol, ...args] = ast.map(item => EVAL(item, env))
        if (!(symbol instanceof MalSymbol)) throw `{${symbol}} is not MalSymbol`;
        let func = env[symbol.value];
        if (!func) throw `{${symbol}} is not in Environment [${Object.keys(env).join(', ')}]`;
        return func.call(...args);
    }
}

function EVAL_AST(ast: MalType, env: MalEnv): MalType {
    if (ast instanceof MalSymbol) {
        return MalSymbol.get(ast.value);
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
            callback(null, e);
        }
    }

    repl.start({ prompt: '> ', eval: malEval });
}

main();
