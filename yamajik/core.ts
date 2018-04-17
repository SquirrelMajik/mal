import { printString } from "./printer";
import { MalUnexpectedTokenType, MalUnexpectedToken } from "./errors";
import {
    isMalList, checkMalTypeIsMalList, isMalType, isMalVector,
    isFunction, checkMalTypeIsMalVector, checkMalTypeIsMalNumber,
    checkMalInnerMultipleParameters, checkMalTypeIsMalVectorOrMalList,
} from "./checker";
import {
    Symbols, MalType, MalNumber, MalList, MalNativeFunction,
    MalBoolean, MalString, MalNil, MalUndefined, MalSymbol, MalVector
} from "./types";


interface Namespace {
    [key: string]: MalType | Function;
}

const namespace: Namespace = {
    // values
    [Symbols.True]: MalBoolean.get(true),
    [Symbols.False]: MalBoolean.get(false),
    [Symbols.Nil]: MalNil.get(),
    [Symbols.Undefined]: MalUndefined.get(),
    // functions
    [Symbols.Plus]: plus,
    [Symbols.Minus]: minus,
    [Symbols.Multiply]: multiply,
    [Symbols.Divide]: divide,
    [Symbols.CeilDivide]: ceilDivide,
    [Symbols.List]: list,
    [Symbols.IsList]: isList,
    [Symbols.IsEmpty]: isEmpty,
    [Symbols.Count]: count,
    [Symbols.Equal]: equal,
    [Symbols.LessThan]: lessThan,
    [Symbols.LessEqual]: lessEqual,
    [Symbols.GreatThan]: greatThan,
    [Symbols.GreatEqual]: greatEqual,
    [Symbols.PrintString]: printStr,
    [Symbols.String]: string,
    [Symbols.Print]: print,
    [Symbols.PrintLine]: println
};

export default new Map<MalSymbol, MalType>(Object.keys(namespace).map((symbol: Symbols) => {
    return processEachNamespace(symbol, namespace);
}));

function processEachNamespace(symbol: Symbols, namespace: Namespace): [MalSymbol, MalType] {
    let val = namespace[symbol];
    const sym = MalSymbol.get(symbol);
    if (isMalType(val)) {
        return [sym, val];
    } else if (isFunction(val)) {
        return [sym, new MalNativeFunction(val)];
    } else {
        throw new MalUnexpectedTokenType(val, MalType, Function);
    }
}

function plus(...params: Array<MalType>): MalNumber {
    params.forEach(checkMalTypeIsMalNumber);
    return new MalNumber(params.reduce((total: number, param: MalType) => {
        return total + param.value;
    }, 0));
}

function minus(...params: Array<MalType>): MalNumber {
    params.forEach(checkMalTypeIsMalNumber);
    return new MalNumber(params.reduce((total: number, param: MalType) => {
        return total - param.value;
    }, 0));
}

function multiply(...params: Array<MalType>): MalNumber {
    params.forEach(checkMalTypeIsMalNumber);
    return new MalNumber(params.reduce((total: number, param: MalType) => {
        return total * param.value;
    }, 1));
}

function divide(...params: Array<MalType>): MalNumber {
    checkMalInnerMultipleParameters(MalSymbol.get(Symbols.Divide), params, 1);
    params.forEach(checkMalTypeIsMalNumber);
    const base = params.length === 1 ? 1 : params.shift().value;
    params.unshift(new MalNumber(1));
    return new MalNumber(params.reduce((total: number, param: MalType) => {
        return total / param.value;
    }, base));
}

function ceilDivide(...params: Array<MalType>): MalNumber {
    checkMalInnerMultipleParameters(MalSymbol.get(Symbols.Divide), params, 1);
    params.forEach(checkMalTypeIsMalNumber);
    const base = params.length === 1 ? 1 : params.shift().value;
    return new MalNumber(params.reduce((total: number, param: MalType) => {
        return Math.floor(total / param.value);
    }, base));
}

function list(...instances: Array<MalType>): MalList {
    return new MalList(instances);
}

function isList(instance: MalType): MalBoolean {
    return MalBoolean.get(isMalList(instance));
}

function isEmpty(instance: MalType): MalBoolean {
    checkMalTypeIsMalVectorOrMalList(instance);
    return MalBoolean.get((instance as MalVector).length > 0);
}

function count(instance: MalType): MalNumber {
    checkMalTypeIsMalVectorOrMalList(instance);
    return new MalNumber((instance as MalVector).length);
}

function equal(...params: Array<MalType>): MalBoolean {
    checkMalInnerMultipleParameters(MalSymbol.get(Symbols.Divide), params, 1);
    return MalBoolean.get(params.every((param, index, array) => {
        return index < array.length - 1 ? param.equal(array[index + 1]) : true;
    }));
}

function lessThan(...params: Array<MalType>): MalBoolean {
    params.forEach(checkMalTypeIsMalNumber);
    return MalBoolean.get(params.every((param, index, array) => {
        return index < array.length - 1 ? param.value < array[index + 1].value : true;
    }));
}

function lessEqual(...params: Array<MalType>): MalBoolean {
    params.forEach(checkMalTypeIsMalNumber);
    return MalBoolean.get(params.every((param, index, array) => {
        return index < array.length - 1 ? param.value <= array[index + 1].value : true;
    }));
}

function greatThan(...params: Array<MalType>): MalBoolean {
    params.forEach(checkMalTypeIsMalNumber);
    return MalBoolean.get(params.every((param, index, array) => {
        return index < array.length - 1 ? param.value > array[index + 1].value : true;
    }));
}

function greatEqual(...params: Array<MalType>): MalBoolean {
    params.forEach(checkMalTypeIsMalNumber);
    return MalBoolean.get(params.every((param, index, array) => {
        return index < array.length - 1 ? param.value >= array[index + 1].value : true;
    }));
}

function printStr(...instances: Array<MalType>): MalString {
    const newString = instances.map(instance => printString(instance, true)).join(" ");
    return new MalString(newString);
}

function string(...instances: Array<MalType>): MalString {
    const newString = instances.map(instance => printString(instance, false)).join("");
    return new MalString(newString);
}

function print(...instances: Array<MalType>): MalNil {
    const newString = instances.map(instance => printString(instance, true)).join(" ");
    console.log(newString)
    return MalNil.get();
}

function println(...instances: Array<MalType>): MalNil {
    const newString = instances.map(instance => printString(instance, false)).join(" ");
    console.log(newString)
    return MalNil.get();
}
