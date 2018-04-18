import { MalType } from "types";


export function printString(exp: MalType, readable: boolean = true): string {
    return exp.toString(readable);
}

export function exprString(exp: MalType): String {
    return exp.expr();
}
