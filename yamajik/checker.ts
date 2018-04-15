import { MalType, MalList, MalSymbol } from "./types"
import { MalUnexpectedTokenType } from "./errors";


export function checkMalTypeIsMalSymbol(token: MalType) {
    checkMalType(token, MalSymbol);
}

export function checkMalTypeIsMalList(token: MalType) {
    checkMalType(token, MalList);
}

export function checkMalType(token: MalType, excepted: typeof MalType) {
    if (!isInstance(token, excepted)) {
        throw new MalUnexpectedTokenType(token, excepted);
    }
}

export function isInstance(instance: any, classType: any): boolean {
    return instance instanceof classType;
}
