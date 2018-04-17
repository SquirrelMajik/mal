import config from "./config";
import { groupArray, isInstance, chain } from "./utils";
import { isMalKeyword, isMalString } from "./checker";
import { MalNotCallable, MalInvalidBooleanValue, MalUnexpectedTokenType } from "./errors";


export const MalTypeRegex = {
    string: /^"(?:[^"\\]|\\.)*?"$/,
    integer: /^-?[0-9]+$/,
    float: /^-?[0-9]\.[0-9]+$/,
    variable: /^[&_a-zA-Z][_a-zA-Z0-9!\*]*$/
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
        this.value = value;
        return this;
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

    push(...item: Array<MalType>): number {
        this.value.push(...item);
        return this.length;
    }

    *[Symbol.iterator](): IterableIterator<MalType> {
        yield* this.value;
    }

    *group(chunkSize: number): IterableIterator<Array<MalType>> {
        yield* groupArray(this.value, chunkSize);
    }

    valueString(): string {
        return `[${this.value.map(item => item.toString()).join(', ')}]`;
    }
}

export class MalList extends MalVector {
    slice(start?: number, end?: number): MalList {
        return new MalList(this.value.slice(start, end));
    }

    valueString(): string {
        return `(${this.value.map(item => item.toString()).join(', ')})`;
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

    valueString(readable: boolean = true): string {
        return readable ? `"${eval(this.value)}"` : `"${this.value}"`;
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

    valueString(): string {
        const valueStrings = Array.from(chain(this.keywordMap, this.stringMap)).map(item => {
            const [key, value] = item;
            return `${key.toString()} => ${value.toString()}`;
        });
        return `{${valueStrings.join(", ")}}`;
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

    isMultiple(): boolean {
        return this.value.startsWith("&") || this.value.startsWith("...");
    }
}

export class MalFunction extends MalType {
    value: Function;

    constructor(value: Function) {
        super(value);
    }

    call(...args: Array<MalType>): MalType {
        return this.value(...args);
    }

    valueString(): string {
        return "[function]";
    }
}

export const enum Symbols {
    // values
    True = "true",
    False = "false",
    Nil = "nil",
    Undefined = "undefined",
    // inner functions
    Def = "def!",
    Let = "let*",
    Do = "do",
    If = "if",
    Fn = "fn*",
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
    PrintString = "prstr",
    String = "str",
    Print = "prn",
    PrintLine = "println"
}
