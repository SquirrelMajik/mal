import { MalType, MalSymbol } from "./types"
import { MalEnv } from "env";


export class MalError extends Error {
    message: string = "MalError";

    toString() {
        return this.message;
    }
}

export class MalUnexpectedTokenType extends MalError {
    token: MalType;
    excepted: typeof MalType;

    constructor(token: MalType, excepted: typeof MalType) {
        super();
        this.token = token;
        this.excepted = excepted;
        this.message = `Unexcepted token type: ${this.token}, excepted: ${this.excepted.name}`;
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

export class MalReadError extends MalError {
    constructor(message: string) {
        super();
        this.message = `Error while reading: ${message}`;
    }
}

export class MalNotCallable extends MalError {
    constructor(instance: MalType) {
        super();
        this.message = `Not callable: ${instance}`;
    }
}
