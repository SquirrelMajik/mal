import { MalType } from "types";
import { MalEnv } from "env";


export function printString(exp: MalType, readable: boolean = true): string {
    return exp.toString(readable);
}

export function exprString(exp: MalType): String {
    return exp.expr();
}

export function debugPrint(exp: MalType, readable: boolean = true) {
    console.log(`Debug: ${printString(exp, readable)}`);
}
