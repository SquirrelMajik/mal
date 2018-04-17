import { printString } from "./printer";
import { MalUnexpectedTokenType, MalUnexpectedToken } from "./errors";
import { isMalList, checkMalTypeIsMalList, isMalType, isFunction } from "./checker";
import {
    Symbols, MalType, MalNumber, MalList, MalFunction,
    MalBoolean, MalString, MalNil, MalUndefined, MalSymbol
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
        return [sym, new MalFunction(val)];
    } else {
        throw new MalUnexpectedTokenType(val, MalType, Function);
    }
}

function plus(x: MalType, y: MalType): MalType {
    return new MalNumber(x.value + y.value);
}

function minus(x: MalType, y: MalType): MalType {
    return new MalNumber(x.value - y.value);
}

function multiply(x: MalType, y: MalType): MalType {
    return new MalNumber(x.value * y.value);
}

function divide(x: MalType, y: MalType): MalType {
    return new MalNumber(x.value / y.value);
}

function ceilDivide(x: MalType, y: MalType): MalType {
    return new MalNumber(Math.floor(x.value / y.value));
}

function list(...instances: Array<MalType>): MalList {
    return new MalList(instances);
}

function isList(instance: MalType): MalBoolean {
    return MalBoolean.get(isMalList(instance));
}

function isEmpty(instance: MalType): MalBoolean {
    if (!isMalList(instance)) {
        throw new MalUnexpectedTokenType(instance, MalList);
    }
    return MalBoolean.get(instance.length > 0);
}

function count(instance: MalType): MalNumber {
    if (!isMalList(instance)) {
        throw new MalUnexpectedTokenType(instance, MalList);
    }
    return new MalNumber(instance.length);
}

function equal(x: MalType, y: MalType): MalBoolean {
    return MalBoolean.get(x.equal(y));
}

function lessThan(x: MalType, y: MalType): MalBoolean {
    return MalBoolean.get(x.value < y.value);
}

function lessEqual(x: MalType, y: MalType): MalBoolean {
    return MalBoolean.get(x.value <= y.value);
}

function greatThan(x: MalType, y: MalType): MalBoolean {
    return MalBoolean.get(x.value > y.value);
}

function greatEqual(x: MalType, y: MalType): MalBoolean {
    return MalBoolean.get(x.value >= y.value);
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
