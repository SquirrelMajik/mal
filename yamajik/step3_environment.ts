import repl from 'repl';
import { readString } from './reader';
import { printString } from './printer';
import { MalType, MalList, MalNumber, MalSymbol, MalFunction } from './types';
import { MalEnv } from './env';


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
        if (!(symbol instanceof MalSymbol)) throw `Unexcepted Token Type: {${symbol}}, except MalSymbol`;

        if (MalSymbol.get("def!").equal(symbol)) {
            const [, key, value] = ast.value;
            return DEF(env, key, value);
        } else if (MalSymbol.get("let*").equal(symbol)) {
            const [, bindings, letAst] = ast.value;
            return LET(env, bindings, letAst);
        } else {
            const [func, ...args] = ast.map(item => EVAL(item, env));
            return func.call(...args);
        }
    }

    function DEF(env: MalEnv, key: MalType, value: MalType): MalType {
        if (!(key instanceof MalSymbol)) throw `Unexcepted Token Type: {${key}}, except MalSymbol`;
        return env.set(key, value);
    }

    function LET(env: MalEnv, bindings: MalType, ast: MalType): MalType {
        const newEnv = new MalEnv(env);
        if (!(bindings instanceof MalList)) throw `Unexcepted Token Type: {${bindings}}, except MalList`;
        for (const [key, value] of bindings.group(2)) {
            if (!(key instanceof MalSymbol)) throw `Unexcepted Token Type: {${key}}, except MalSymbol`;
            if (!key || !value) throw "Unexcepted Syntax";
            newEnv.set(key, EVAL_AST(value, newEnv));
        }
        return EVAL_AST(ast, newEnv);
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
            callback(null, e);
        }
    }

    repl.start({ prompt: '> ', eval: malEval });
}

main();
