import config from "./config";
import { groupArray, isInstance, chain } from "./utils";
import { isMalKeyword, isMalString } from "./checker";
import { MalNotCallable, MalInvalidBooleanValue, MalUnexpectedTokenType } from "./errors";
import { MalEnv } from "env";


export const MalTypeRegex = {
    string: /^"(?:[^"\\]|\\.)*?"$/,
    integer: /^-?[0-9]+$/,
    float: /^-?[0-9]\.[0-9]+$/,
    variable: /^[&_a-zA-Z][_\-a-zA-Z0-9!\*]*$/,
    keyword: /^:/,
    comment: /^(?:\/\/)|;/
}

export class MalType {
    value: any;

    constructor(value?: any) {
        this.value = value;
    }

    get type(): string {
        return this.constructor.name;
    }

    set(value: any): MalType {
        return this.value = value;
    }

    addTypePrompt(func: Function): Function {
        return (...args: Array<any>) => {
            const prompt = config.debug ? this.typePrompt : '';
            return prompt + func(...args);
        }
    }

    get typePrompt(): string {
        return `${this.type}: `;
    }

    expr(): string {
        return this.valueString(true);
    }

    valueString(readable: boolean = true): string {
        return this.value.toString();
    }

    toString(readable: boolean = true): string {
        const prompt = config.debug ? this.typePrompt : '';
        return prompt + this.valueString(readable);
    }

    call(...args: Array<any>): any {
        throw new MalNotCallable(this);
    }

    equal(another: MalType): boolean {
        return this === another || this.valueEqual(another);
    }

    valueEqual(another: MalType): boolean {
        return this.type === another.type && this.value === another.value;
    }
}

export class MalVector extends MalType {
    value: Array<MalType>;

    constructor(value: Array<MalType> = []) {
        super(value);
    }

    map(callback: (item: MalType, index: number, array: Array<MalType>) => any): Array<any> {
        return this.value.map(callback);
    }

    forEach(callback: (item: MalType, index: number, array: Array<MalType>) => any): void {
        return this.value.forEach(callback);
    }

    get length(): number {
        return this.value.length;
    }

    get(index: number): MalType {
        return this.value[index] || MalUndefined.get();
    }

    first(): MalType {
        return this.get(0);
    }

    last(): MalType {
        return this.get(this.length - 1);
    }

    slice(start?: number, end?: number): MalVector {
        return new MalVector(this.value.slice(start, end));
    }

    push(...items: Array<MalType>): number {
        return this.value.push(...items);
    }

    pop(): MalType {
        return this.value.pop();
    }

    unshift(...items: Array<MalType>): number {
        return this.value.unshift(...items);
    }

    shift(): MalType {
        return this.value.shift();
    }

    *[Symbol.iterator](): IterableIterator<MalType> {
        yield* this.value;
    }

    *group(chunkSize: number): IterableIterator<Array<MalType>> {
        yield* groupArray(this.value, chunkSize);
    }

    valueString(readable: boolean = true): string {
        const split = readable ? " " : ", ";
        return `[${this.value.map(item => item.toString(readable)).join(split)}]`;
    }
}

export class MalList extends MalVector {
    slice(start?: number, end?: number): MalList {
        return new MalList(this.value.slice(start, end));
    }

    valueString(readable: boolean = true): string {
        const split = readable ? " " : ", ";
        return `(${this.value.map(item => item.toString(readable)).join(split)})`;
    }
}

export class MalNumber extends MalType {
    value: number;
}

export class MalString extends MalType {
    value: string;

    constructor(value: string) {
        super(value);
    }

    get string(): string {
        return this.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    }

    valueString(readable: boolean = true): string {
        return readable ? `"${this.string}"` : this.value;
    }
}

export class MalBoolean extends MalType {
    private static trueInstance: MalBoolean = new MalBoolean(true);
    private static falseInstance: MalBoolean = new MalBoolean(false);

    static get(value: boolean): MalBoolean {
        return value ? this.trueInstance : this.falseInstance;
    }

    value: boolean;

    private constructor(value: boolean) {
        super(value);
    }
}

export class MalNil extends MalType {
    private static instance: MalNil = new MalNil();

    static get(): MalNil {
        return MalNil.instance;
    }

    value: null = null;

    private constructor() {
        super(null);
    }

    valueString(): string {
        return "nil";
    }
}

export class MalUndefined extends MalType {
    private static instance: MalUndefined = new MalUndefined();

    static get(): MalUndefined {
        return MalUndefined.instance;
    }

    value: undefined = undefined;

    private constructor() {
        super(undefined);
    }

    valueString(): string {
        return "";
    }
}

export class MalKeyword extends MalType {
    private static map = new Map<symbol, MalKeyword>();

    static get(name: string) {
        const sym = Symbol.for(name);
        let token = this.map.get(sym);
        if (!token) {
            token = new MalKeyword(name);
            this.map.set(sym, token);
        }
        return token;
    }

    value: string;

    private constructor(value: string) {
        super(value);
    }

    valueString(): string {
        return `:${this.value}`;
    }
}

export class MalHashMap extends MalType {
    static mapEqual(map1: Map<any, any>, map2: Map<any, any>) {
        return map1 === map2;
    }

    keywordMap = new Map<MalKeyword, MalType>();
    stringMap = new Map<MalString, MalType>();

    constructor(mapValues: Array<Array<MalType>>) {
        super();
        mapValues.forEach(mapValue => {
            const [key, value] = mapValue;
            if (isMalKeyword(key)) {
                this.keywordMap.set(key, value);
            } else if (isMalString(key)) {
                this.stringMap.set(key, value);
            } else {
                throw new MalUnexpectedTokenType(key, MalKeyword, MalString);
            }
        })
    }

    *[Symbol.iterator](): IterableIterator<[MalType, MalType]> {
        yield* this.entries();
    }

    *entries(): IterableIterator<[MalType, MalType]> {
        yield* this.keywordMap;
        yield* this.stringMap;
    }

    equal(another: MalHashMap): boolean {
        return this === another ||
            (MalHashMap.mapEqual(this.keywordMap, another.keywordMap) &&
                MalHashMap.mapEqual(this.stringMap, another.stringMap));
    }

    valueString(readable: boolean = true): string {
        const kvSplit = readable ? " " : " => ";
        const itemSplit = readable ? " " : ", ";
        const valueStrings = Array.from(chain(this.keywordMap, this.stringMap)).map(item => {
            const [key, value] = item;
            return [key.toString(readable), value.toString(readable)].join(kvSplit);
        });
        return `{${valueStrings.join(itemSplit)}}`;
    }
}

export class MalSymbol extends MalType {
    static map = new Map<symbol, MalSymbol>();

    static get(name: string): MalSymbol {
        const sym = Symbol.for(name);
        let token = this.map.get(sym);
        if (!token) {
            token = new MalSymbol(name);
            this.map.set(sym, token);
        }
        return token;
    }

    static has(name: string): boolean {
        const sym = Symbol.for(name);
        return this.map.has(sym);
    }

    value: string;

    private constructor(value: string) {
        super(value);
    }
}

export class MalNativeFunction extends MalType {
    value: Function;

    call(...args: Array<MalType>): MalType {
        return this.value(...args);
    }

    valueString(): string {
        return "[native function]";
    }
}

export class MalFunction extends MalType {
    ast: MalType;
    params: MalVector;
    env: MalEnv;
    value: Function;
    isMacro: boolean;

    constructor(ast: MalType, params: MalVector, env: MalEnv, fn: Function, isMacro: boolean = false) {
        super(fn);
        this.ast = ast;
        this.params = params;
        this.env = env;
        this.isMacro = isMacro;
    }

    call(...args: Array<MalType>): MalType {
        return this.value(...args);
    }

    valueString(): string {
        return "[function]";
    }
}

export class MalAtom extends MalType {
    value: MalType;

    reset(value: MalType) {
        return this.value = value;
    }

    valueString(readable: boolean = true): string {
        if (readable) {
            return `(atom ${this.value.toString()})`
        } else {
            return `atom => ${this.value.toString()}`;
        }
    }
}

export const enum Symbols {
    // values
    True = "true",
    False = "false",
    Nil = "nil",
    Undefined = "undefined",
    Argv = "*ARGV*",
    // inner functions
    Def = "def!",
    Defmacro = "defmacro!",
    Let = "let*",
    Do = "do",
    If = "if",
    Fn = "fn*",
    Eval = "eval",
    Quote = "quote",
    Quasiquote = "quasiquote",
    // functions
    Plus = "+",
    Minus = "-",
    Multiply = "*",
    Divide = "/",
    CeilDivide = "//",
    List = "list",
    IsList = "list?",
    IsEmpty = "empty?",
    Count = "count",
    Equal = "=",
    LessThan = "<",
    LessEqual = "<=",
    GreatThan = ">",
    GreatEqual = ">=",
    PrintString = "print-str",
    String = "str",
    Print = "print",
    PrintLine = "println",
    ReadString = "read-str",
    Slurp = "slurp",
    Atom = "atom",
    IsAtom = "atom?",
    Deref = "deref",
    Reset = "reset!",
    Swap = "swap!",
    Cons = "cons",
    Concat = "concat",
    Unquote = "unquote",
    SpliceUnquote = "splice-unquote",
    Macroexpand = "macroexpand",
    Nth = "nth",
    First = "first",
    Rest = "rest"
}
