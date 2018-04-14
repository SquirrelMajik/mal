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

    set(value: any): MalType {
        this.value = value;
        return this;
    }

    toString(): string {
        return `${this.constructor.name}: ${this.value.toString()}`
    }

    call(...args: any[]): any {
        throw `${this} is not callable`;
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

    toString(): string {
        const valueString = `[${this.value.map(item => item.toString()).join(', ')}]`;
        return `${this.constructor.name}: ${valueString}`
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

    toString(): string {
        return "MalNil";
    }
}

export class MalUndefined extends MalType {
    value: undefined = undefined;

    toString(): string {
        return "MalUndefined";
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

    call(...args: any[]): any {
        return this.value(...args);
    }
}

export const enum Symbols {

}
