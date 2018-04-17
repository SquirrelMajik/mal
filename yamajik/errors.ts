import { MalEnv } from "./env";
import { MalType, MalSymbol, MalList, Symbols, MalVector } from "./types"


export class MalError extends Error {
    message: string = "MalError";

    toString() {
        return this.message;
    }
}

export class MalReadError extends MalError {
    constructor(message: string) {
        super();
        this.message = `Error while reading: ${message}`;
    }
}

export class MalUnexpectedToken extends MalReadError {
    token: string;

    constructor(token: string) {
        super(null);
        this.token = token;
        this.message = `Unexcepted token: ${this.token}`;
    }
}

export class MalUnexpectedTokenType extends MalError {
    token: MalType;
    excepted: Array<typeof MalType>;

    constructor(token: MalType, ...excepted: Array<any>) {
        super();
        this.token = token;
        this.excepted = excepted;
        this.message = `Unexcepted token type: ${this.token}, excepted: ${this.excepted.map(item => item.name).join(", ")}`;
    }
}

export class MalNotFound extends MalError {
    symbol: MalSymbol;
    env: MalEnv;

    constructor(symbol: MalSymbol, env: MalEnv) {
        super();
        this.symbol = symbol;
        this.env = env;
        this.message = `Not found: ${this.symbol}`;
    }
}



export class MalNotCallable extends MalError {
    constructor(instance: MalType) {
        super();
        this.message = `Not callable: ${instance}`;
    }
}

export class MalUnexceptedSyntax extends MalError {
    message: string = "Unexcepted syntax";
}

export class MalInvalidBooleanValue extends MalError {
    token: string;

    constructor(token: string) {
        super();
        this.token = token;
        this.message = `Invalid boolean: ${token}`;
    }
}

export class MalInvalidRestParameter extends MalError {
    instance: MalType;

    constructor(instance: MalType) {
        super();
        this.instance = instance;
        this.message = `Invalid rest parameter: ${this.instance} should be set as the last one`;
    }
}

export class MalUnexpectedLength extends MalError {
    base: number;
    instance: MalVector;

    constructor(instance: MalVector, base: number) {
        super();
        this.base = base;
        this.instance = instance;
        this.message = `Unexpected length: ${this.instance.length}, excepted multiple of ${this.base} - ${this.instance}`;
    }
}

export class MalParametersError extends MalError {
    symbol: MalSymbol;
    called: number;
    excepted: number;

    constructor(symbol: MalSymbol, called: number, excepted: number) {
        super();
        this.symbol = symbol;
        this.called = called;
        this.excepted = excepted;
        this.message = `${this.symbol} needs ${this.excepted} parameters, called ${this.called}`;
    }
}

export class MalMultipleParametersError extends MalParametersError {
    constructor(symbol: MalSymbol, called: number, excepted: number) {
        super(symbol, called, excepted);
        this.message = `${this.symbol} needs at least ${this.excepted} parameters, called ${this.called}`;
    }
}
