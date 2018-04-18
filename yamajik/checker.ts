import { isInstance } from "./utils";
import { MalUnexpectedTokenType, MalMultipleParametersError, MalParametersError, MalUnexpectedLength } from "./errors";
import {
    MalType, MalList, MalSymbol, MalBoolean, MalNil, MalNumber,
    MalKeyword, MalString, MalVector, MalFunction, MalHashMap, MalNativeFunction, MalAtom
} from "./types"


export function checkMalParameters(symbol: MalSymbol, parameters: MalVector, excepted: MalVector): void {
    const calledNum = parameters.length;
    const exceptedNum = excepted.length;
    if ((excepted.last() as MalSymbol).isMultiple()) {
        if (calledNum < exceptedNum - 1) throw new MalMultipleParametersError(symbol, calledNum, exceptedNum - 1);
    } else {
        if (calledNum !== exceptedNum) throw new MalParametersError(symbol, calledNum, exceptedNum);
    }
}

export function checkMalInnerParameters(symbol: MalSymbol, parameters: Array<MalType>, excepted: number): void {
    const calledNum = parameters.length;
    if (calledNum !== excepted) throw new MalParametersError(symbol, calledNum, excepted);
}

export function checkMalInnerMultipleParameters(symbol: MalSymbol, parameters: Array<MalType>, atLeastExcepted: number): void {
    const calledNum = parameters.length;
    if (calledNum < atLeastExcepted) throw new MalMultipleParametersError(symbol, calledNum, atLeastExcepted);
}

export function checkMalVectorLength(instance: MalVector, base: number): void {
    if (instance.length % base !== 0) throw new MalUnexpectedLength(instance, base);
}

export function checkMalTypeIsMalNumber(instance: MalType): void {
    checkMalType(instance, MalNumber);
}

export function checkMalTypeIsMalSymbol(instance: MalType): void {
    checkMalType(instance, MalSymbol);
}

export function checkMalTypeIsMalVectorOrMalList(instance: MalType): void {
    checkMalType(instance, MalVector, MalList);
}

export function checkMalTypeIsMalVector(instance: MalType): void {
    checkMalType(instance, MalVector);
}

export function checkMalTypeIsMalList(instance: MalType): void {
    checkMalType(instance, MalList);
}

export function checkMalTypeIsFunction(instance: MalType): void {
    checkMalType(instance, MalFunction, MalNativeFunction);
}

export function checkMalTypeIsMalNativeFunction(instance: MalType): void {
    checkMalType(instance, MalNativeFunction);
}

export function checkMalTypeIsMalFunction(instance: MalType): void {
    checkMalType(instance, MalFunction);
}

export function checkMalTypeIsMalFunctionOrMalNativeFunction(instance: MalType): void {
    checkMalType(instance, MalFunction, MalNativeFunction);
}

export function checkMalTypeIsMalString(instance: MalType): void {
    checkMalType(instance, MalString);
}

export function checkMalTypeIsMalAtom(instance: MalType): void {
    checkMalType(instance, MalAtom);
}

export function checkMalTypeIsMalType(instance: MalType): void {
    checkMalType(instance, MalType);
}

export function checkMalType(instance: MalType, ...excepted: Array<any>): void {
    if (excepted.every(excepted => !isInstance(instance, excepted))) {
        throw new MalUnexpectedTokenType(instance, ...excepted);
    }
}

export function isPositive(instance: MalType) {
    return !(isFalse(instance) || isInstance(instance, MalNil));
}

export function isFalse(instance: MalType) {
    return isInstance(instance, MalBoolean) && instance.value === false;
}

export function isMalType(instance: any): instance is MalType {
    return isInstance(instance, MalType);
}

export function isMalList(instance: any): instance is MalList {
    return isInstance(instance, MalList);
}

export function isMalVector(instance: any): instance is MalVector {
    return isInstance(instance, MalVector);
}

export function isMalHashMap(instance: any): instance is MalHashMap {
    return isInstance(instance, MalHashMap);
}

export function isMalSymbol(instance: any): instance is MalSymbol {
    return isInstance(instance, MalSymbol);
}

export function isMalKeyword(instance: any): instance is MalKeyword {
    return isInstance(instance, MalKeyword);
}

export function isMalString(instance: any): instance is MalString {
    return isInstance(instance, MalString);
}

export function isMalFunction(instance: any): instance is MalFunction {
    return isInstance(instance, MalFunction);
}

export function isMalNativeFunction(instance: any): instance is MalNativeFunction {
    return isInstance(instance, MalNativeFunction);
}

export function isMalAtom(instance: any): instance is MalAtom {
    return isInstance(instance, MalAtom);
}

export function isFunction(instance: any): instance is Function {
    return isInstance(instance, Function);
}
