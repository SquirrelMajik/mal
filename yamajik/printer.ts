import { MalType } from "types";


export function printString(exp: MalType, readable: boolean = true): string {
    return exp.toString(readable);
}
