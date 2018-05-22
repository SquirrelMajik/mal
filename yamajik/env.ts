import { read } from "fs";

import { isRestMalSymbol } from "./checker";
import { MalNotFound, MalInvalidRestParameter } from "./errors";
import {
  MalType,
  MalList,
  MalUndefined,
  MalSymbol,
  MalVector,
  MalNil
} from "./types";

export class MalEnv {
  data: Map<MalSymbol, MalType>;
  outer: MalEnv;

  constructor(
    outer?: MalEnv,
    bindings: MalVector = new MalList(),
    exprs: MalList = new MalList()
  ) {
    this.data = new Map();
    this.outer = outer;

    for (let index = 0; index < bindings.length; index++) {
      const binding = bindings.get(index);
      if (isRestMalSymbol(binding)) {
        if (index !== bindings.length - 2)
          throw new MalInvalidRestParameter(bindings);
        const nextSymbol = bindings.get(index + 1);
        this.set(nextSymbol as MalSymbol, exprs.slice(index));
        break;
      } else {
        this.set(binding as MalSymbol, exprs.get(index) || MalNil.get());
      }
    }
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

  has(key: MalSymbol): boolean {
    return !!this.find(key);
  }

  toString(readable: boolean = true): string {
    const mappings = [];
    for (const [key, value] of this.data) {
      mappings.push(
        `\t${key.toString(readable)} => ${value.toString(readable)}`
      );
    }
    return `Environment: \n${mappings.join("\n")}`;
  }
}
