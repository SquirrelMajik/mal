import { MalNotCallable } from "./errors";
import config from "./config";


export const MalTypeRegex = {
    string: /^['|"]/,
    integer: /^-?[0-9]+$/,
    float: /^-?[0-9]\.[0-9]+$/
}

export class MalType {
    value: any;

    constructor(value: any) {
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

    valueString(): string {
        return this.value.toString();
    }

    toString(): string {
        const prompt = config.debug ? this.typePrompt : '';
        return prompt + this.valueString();
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

export class MalList extends MalType {
    value: Array<MalType>;

    map(callback: (item: MalType, index: number, array: Array<MalType>) => any): Array<any> {
        return this.value.map(callback);
    }

    get length(): number {
        return this.value.length;
    }

    get(index: number): MalType {
        return this.value[index] || new MalUndefined();
    }

    first(): MalType {
        return this.get(0);
    }

    *[Symbol.iterator](): Iterable<MalType> {
        yield* this.value;
    }

    *group(chunkSize: number): Iterable<Array<MalType>> {
        for (let i = 0; i < this.length; i += chunkSize) {
            yield this.value.slice(i, i + chunkSize);
        }
    }

    valueString(): string {
        return `[${this.value.map(item => item.toString()).join(', ')}]`;
    }
}

export class MalNumber extends MalType {
    value: number;
}

export class MalString extends MalType {
    value: string;

    constructor(value: string) {
        super(eval(value));
    }
}

export class MalBoolean extends MalType {
    value: boolean;

    constructor(value: string) {
        super(eval(value));
    }
}

export class MalNil extends MalType {
    value: null = null;

    constructor() {
        super(null);
    }

    valueString(): string {
        return "nil";
    }
}

export class MalUndefined extends MalType {
    value: undefined = undefined;

    constructor() {
        super(undefined);
    }

    valueString(): string {
        return "undefined";
    }
}

export class MalKeyword extends MalType {
    value: string;
}

export class MalVector extends MalType {

}

export class MalHashMap extends MalType {
    value: object;
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

    value: string;
}

export class MalFunction extends MalType {
    value: Function;

    call(...args: Array<any>): any {
        return this.value(...args);
    }

    toString(): string {
        return "[function]";
    }
}

export const enum Symbols {
    DEF = "def!",
    LET = "let*",
    DO = "do",
    IF = "if",
    FN = "fn*"
}
