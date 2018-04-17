import { MalNotFound, MalInvalidRestParameter } from "./errors";
import { MalType, MalList, MalUndefined, MalSymbol } from "./types";

export class MalEnv {
    data: Map<MalSymbol, MalType>;
    outer: MalEnv;

    constructor(outer?: MalEnv, bindings: Array<MalSymbol> = [], exprs: Array<MalType> = []) {
        this.data = new Map();
        this.outer = outer;

        bindings.forEach((binding, index, array) => {
            if (binding.isMultiple()) {
                if (index >= array.length) throw new MalInvalidRestParameter(binding);
                this.set(binding, new MalList(exprs.slice(index)));
            } else {
                this.set(binding, exprs[index]);
            }
        });
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
            throw new MalNotFound(key, this);
        }
    }

    toString(): string {
        return `Environment: ${this.data}`;
    }
}
