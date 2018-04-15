import { MalType, MalUndefined, MalSymbol } from "./types";


export class MalEnv {
    data: Map<MalSymbol, MalType>;
    outer: MalEnv;

    constructor(outer?: MalEnv) {
        this.data = new Map();
        this.outer = outer;
    }

    set(key: MalSymbol, value: MalType): MalType {
        this.data.set(key, value);
        return value;
    }

    find(key: MalSymbol): MalEnv | undefined {
        if (this.data.has(key)) {
            return this;
        } else if (this.outer) {
            return this.outer.find(key);
        }
    }

    get(key: MalSymbol): MalType {
        let value = this.data.get(key);
        if (value) {
            return value;
        } else if (this.outer) {
            return this.outer.get(key);
        } else {
            console.log(this.data)
            throw `Not Found ${key}`;
        }
    }
}
