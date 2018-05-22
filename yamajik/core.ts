import fs from "fs";

import { groupArray } from "./utils";
import { readString } from "./reader";
import { printString, exprString } from "./printer";
import { MalUnexpectedTokenType, MalUnexpectedToken, MalIndexOutOfRangeError } from "./errors";
import {
    isMalList, checkMalTypeIsMalList, isMalType, isMalVector,
    isFunction, checkMalTypeIsMalVector, checkMalTypeIsMalNumber,
    checkMalInnerMultipleParameters, checkMalTypeIsMalVectorOrMalList, checkMalType, checkMalTypeIsMalSymbol, checkMalTypeIsMalString, isMalAtom, checkMalTypeIsMalType, checkMalTypeIsMalAtom, checkMalTypeIsMalFunctionOrMalNativeFunction, checkMalInnerParameters, isPositive, checkMalVectorLength
} from "./checker";
import {
    Symbols, MalType, MalNumber, MalList, MalNativeFunction,
    MalBoolean, MalString, MalNil, MalUndefined, MalSymbol, MalVector, MalAtom, MalFunction
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
    [Symbols.PrintLine]: println,
    [Symbols.ReadString]: readStr,
    [Symbols.Slurp]: slurp,
    [Symbols.Atom]: atom,
    [Symbols.IsAtom]: isAtom,
    [Symbols.Deref]: deref,
    [Symbols.Reset]: reset,
    [Symbols.Swap]: swap,
    [Symbols.Cons]: cons,
    [Symbols.Concat]: concat,
    [Symbols.Nth]: nth,
    [Symbols.First]: first,
    [Symbols.Rest]: rest
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

function plus(...params: Array<MalNumber>): MalNumber {
    params.forEach(checkMalTypeIsMalNumber);
    return new MalNumber(params.reduce((total: number, param: MalType) => {
        return total + param.value;
    }, 0));
}

function minus(...params: Array<MalNumber>): MalNumber {
    params.forEach(checkMalTypeIsMalNumber);
    const base = params.length > 0 ? params.shift().value : 0;
    return new MalNumber(params.reduce((total: number, param: MalType) => {
        return total - param.value;
    }, base));
}

function multiply(...params: Array<MalNumber>): MalNumber {
    params.forEach(checkMalTypeIsMalNumber);
    return new MalNumber(params.reduce((total: number, param: MalType) => {
        return total * param.value;
    }, 1));
}

function divide(...params: Array<MalNumber>): MalNumber {
    checkMalInnerMultipleParameters(MalSymbol.get(Symbols.Divide), params, 1);
    params.forEach(checkMalTypeIsMalNumber);
    const base = params.length === 1 ? 1 : params.shift().value;
    params.unshift(new MalNumber(1));
    return new MalNumber(params.reduce((total: number, param: MalType) => {
        return total / param.value;
    }, base));
}

function ceilDivide(...params: Array<MalNumber>): MalNumber {
    checkMalInnerMultipleParameters(MalSymbol.get(Symbols.Divide), params, 1);
    params.forEach(checkMalTypeIsMalNumber);
    const base = params.length === 1 ? 1 : params.shift().value;
    return new MalNumber(params.reduce((total: number, param: MalType) => {
        return Math.floor(total / param.value);
    }, base));
}

function list(...params: Array<MalType>): MalList {
    return new MalList(params);
}

function isList(...params: Array<MalType>): MalBoolean {
    checkMalInnerParameters(MalSymbol.get(Symbols.IsList), params, 1);
    const instance = params[0];
    return MalBoolean.get(isMalList(instance));
}

function isEmpty(...params: Array<MalType>): MalBoolean {
    checkMalInnerParameters(MalSymbol.get(Symbols.IsEmpty), params, 1);
    const instance = params[0];
    checkMalTypeIsMalVectorOrMalList(instance);
    return MalBoolean.get((instance as MalVector).length === 0);
}

function count(...params: Array<MalType>): MalNumber {
    checkMalInnerParameters(MalSymbol.get(Symbols.Count), params, 1);
    const instance = params[0];
    checkMalTypeIsMalVectorOrMalList(instance);
    return new MalNumber((instance as MalVector).length);
}

function equal(...params: Array<MalType>): MalBoolean {
    checkMalInnerMultipleParameters(MalSymbol.get(Symbols.Divide), params, 1);
    return MalBoolean.get(params.every((param, index, array) => {
        return index < array.length - 1 ? param.equal(array[index + 1]) : true;
    }));
}

function lessThan(...params: Array<MalNumber>): MalBoolean {
    params.forEach(checkMalTypeIsMalNumber);
    return MalBoolean.get(params.every((param, index, array) => {
        return index < array.length - 1 ? param.value < array[index + 1].value : true;
    }));
}

function lessEqual(...params: Array<MalNumber>): MalBoolean {
    params.forEach(checkMalTypeIsMalNumber);
    return MalBoolean.get(params.every((param, index, array) => {
        return index < array.length - 1 ? param.value <= array[index + 1].value : true;
    }));
}

function greatThan(...params: Array<MalNumber>): MalBoolean {
    params.forEach(checkMalTypeIsMalNumber);
    return MalBoolean.get(params.every((param, index, array) => {
        return index < array.length - 1 ? param.value > array[index + 1].value : true;
    }));
}

function greatEqual(...params: Array<MalNumber>): MalBoolean {
    params.forEach(checkMalTypeIsMalNumber);
    return MalBoolean.get(params.every((param, index, array) => {
        return index < array.length - 1 ? param.value >= array[index + 1].value : true;
    }));
}

function printStr(...params: Array<MalType>): MalString {
    const newString = params.map(param => printString(param, true)).join(" ");
    return new MalString(newString);
}

function string(...params: Array<MalType>): MalString {
    params.forEach(checkMalTypeIsMalString);
    const newString = params.map(param => param.value).join("");
    return new MalString(newString);
}

function print(...params: Array<MalType>): MalNil {
    const newString = params.map(param => printString(param, true)).join(" ");
    console.log(newString)
    return MalNil.get();
}

function println(...params: Array<MalType>): MalNil {
    const newString = params.map(param => printString(param, false)).join(" ");
    console.log(newString)
    return MalNil.get();
}

function readStr(...params: Array<MalType>): MalType {
    checkMalInnerParameters(MalSymbol.get(Symbols.ReadString), params, 1);
    const str = params[0];
    checkMalTypeIsMalString(str);
    return readString(str.value);
}

function slurp(...params: Array<MalType>): MalString {
    checkMalInnerParameters(MalSymbol.get(Symbols.Slurp), params, 1);
    const str = params[0];
    checkMalTypeIsMalString(str);
    const content = fs.readFileSync(str.value, "UTF-8");
    return new MalString(content);
}

function atom(...params: Array<MalType>): MalAtom {
    checkMalInnerParameters(MalSymbol.get(Symbols.Atom), params, 1);
    const instance = params[0];
    checkMalTypeIsMalType(instance);
    return new MalAtom(instance)
}

function isAtom(...params: Array<MalType>): MalBoolean {
    checkMalInnerParameters(MalSymbol.get(Symbols.IsAtom), params, 1);
    const instance = params[0];
    return MalBoolean.get(isMalAtom(instance));
}

function deref(...params: Array<MalType>): MalType {
    checkMalInnerParameters(MalSymbol.get(Symbols.Deref), params, 1);
    const atom = params[0];
    checkMalTypeIsMalAtom(atom);
    return atom.value;
}

function reset(...params: Array<MalType>): MalType {
    checkMalInnerParameters(MalSymbol.get(Symbols.Reset), params, 2);
    const [atom, instance] = params;
    checkMalTypeIsMalAtom(atom);
    checkMalTypeIsMalType(instance);
    return (atom as MalAtom).reset(instance);
}

function swap(...params: Array<MalType>): MalType {
    checkMalInnerMultipleParameters(MalSymbol.get(Symbols.Swap), params, 2);
    const [atom, func, ...args] = params;
    checkMalTypeIsMalAtom(atom);
    checkMalTypeIsMalFunctionOrMalNativeFunction(func);
    args.forEach(checkMalTypeIsMalFunctionOrMalNativeFunction);
    return atom.set(func.call(atom.value, ...args));
}

function cons(...params: Array<MalType>): MalList {
    checkMalInnerParameters(MalSymbol.get(Symbols.Cons), params, 2);
    const [instance, list] = params;
    checkMalTypeIsMalType(instance);
    checkMalTypeIsMalVectorOrMalList(list);
    const newList = new MalList();
    newList.push(instance, ...list as MalVector);
    return newList;
}

function concat(...params: Array<MalType>): MalList {
    params.forEach(checkMalTypeIsMalVectorOrMalList);
    const newList = new MalList();
    params.forEach(param => newList.push(...param as MalVector));
    return newList;
}

function nth(...params: Array<MalType>) {
    checkMalInnerParameters(MalSymbol.get(Symbols.Nth), params, 2);
    const [list, index] = params;
    checkMalTypeIsMalVectorOrMalList(list);
    checkMalTypeIsMalNumber(index);
    const instance = (list as MalVector).get(index.value);
    if (!instance) throw new MalIndexOutOfRangeError(list as MalVector, index);
    return instance;
}

function first(...params: Array<MalType>) {
    checkMalInnerParameters(MalSymbol.get(Symbols.First), params, 1);
    const list = params[0];
    checkMalTypeIsMalVectorOrMalList(list);
    return (list as MalVector).first() || MalNil.get();
}

function rest(...params: Array<MalType>) {
    checkMalInnerParameters(MalSymbol.get(Symbols.First), params, 1);
    const list = params[0];
    checkMalTypeIsMalVectorOrMalList(list);
    const [, ...rest] = list as MalVector;
    return new MalList(rest);
}
