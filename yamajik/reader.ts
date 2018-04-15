import {
    MalType, MalList, MalTypeRegex, MalNumber,
    MalString, MalBoolean, MalSymbol,
    MalNil, MalUndefined
} from "./types";
import { MalReadError } from "./errors";


class Reader {
    tokens: Array<string>;
    position: number;

    constructor(tokens: Array<string>) {
        this.tokens = tokens;
        this.position = 0;
    }

    next(): string {
        return this.tokens[this.position++];
    }

    peek(): string {
        return this.tokens[this.position];
    }

    *readUntil(token: string) {
        let value;
        while (true) {
            value = this.next();
            if (value === token) break;
            yield value;
        }
    }
}

export function readString(str: string): MalType {
    const tokens: Array<string> = tokenizer(str.trim());
    const reader: Reader = new Reader(tokens);
    return readForm(reader);
}

function tokenizer(str: string): Array<string> {
    if (isEmpty(str) || isComment(str)) {
        return [];
    } else {
        let regex = /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"|;.*|[^\s\[\]{}('"`,;)]*)/g
        return str.match(regex).map(token => token.trim());
    }
}

function isEmpty(str: string): boolean {
    return !str;
}

function isComment(str: string): boolean {
    return str.startsWith(';');
}

function readForm(reader: Reader): MalType {
    switch (reader.peek()) {
        case '(': return readList(reader);
        default: return readAtom(reader);
    }
}

function read(reader: Reader, malList: typeof MalList, first: string, end: string): MalList {
    const firstToken: string = reader.next();
    if (firstToken !== first) throw new MalReadError(`${firstToken} is not ${first}`);
    const list: Array<MalType> = [];
    for (let token = reader.peek(); token !== end; token = reader.peek()) {
        if (!token) throw new MalReadError("Unexcept EOF");
        list.push(readForm(reader));
    }
    reader.next();
    return new malList(list);
}

function readList(reader: Reader): MalList {
    return read(reader, MalList, '(', ')');
}

function readAtom(reader: Reader): MalType {
    const token = reader.next();
    return AtomFromToken(token);
}

function AtomFromToken(token: string): MalType {
    const mappings: any = {
        false: MalBoolean,
        true: MalBoolean,
        nil: MalNil,
        undefined: MalUndefined
    };
    const maltype = mappings[token];
    if (maltype) {
        return new maltype(token);
    } else if (token.match(MalTypeRegex.integer)) {
        return new MalNumber(parseInt(token, 10));
    } else if (token.match(MalTypeRegex.float)) {
        return new MalNumber(parseFloat(token));
    } else if (token.match(MalTypeRegex.string)) {
        try {
            return new MalString(token);
        } catch {
            throw new MalReadError(`invalid string ${token}`);
        }
    } else {
        return MalSymbol.get(token);
    }
}
