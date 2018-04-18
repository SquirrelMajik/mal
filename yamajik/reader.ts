import { groupArray } from "./utils";
import { checkMalVectorLength } from "./checker"
import { MalReadError, MalUnexpectedToken } from "./errors";
import {
    MalType, MalList, MalTypeRegex, MalNumber, MalString, MalBoolean,
    MalSymbol, MalNil, MalUndefined, MalVector, MalHashMap, MalKeyword, Symbols
} from "./types";


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
        case undefined: return MalUndefined.get();
        case '(': return readList(reader);
        case '[': return readVector(reader);
        case '{': return readHashMap(reader);
        case '@': return readSymbol(reader, Symbols.Deref);
        default: return readAtom(reader);
    }
}

function read<T extends MalType>(reader: Reader, first: string, end: string): Array<MalType> {
    const firstToken: string = reader.next();
    if (firstToken !== first) throw new MalReadError(`${firstToken} is not ${first}`);
    const list: Array<MalType> = [];
    for (let token = reader.peek(); token !== end; token = reader.peek()) {
        if (!token) throw new MalReadError("Unexcept EOF");
        list.push(readForm(reader));
    }
    reader.next();
    return list;
}

function readList(reader: Reader): MalList {
    const tokens = read(reader, '(', ')');
    return new MalList(tokens);
}

function readVector(reader: Reader): MalVector {
    const tokens = read(reader, '[', ']');
    return new MalVector(tokens);
}

function readHashMap(reader: Reader): MalHashMap {
    const tokens = read(reader, '{', '}');
    const tokenList = new MalList(tokens);
    checkMalVectorLength(tokenList, 2);
    return new MalHashMap(Array.from(tokenList.group(2)))
}

function readSymbol(reader: Reader, name: string) {
    reader.next();
    const sym = MalSymbol.get(name);
    const target = readForm(reader);
    return new MalList([sym, target]);
}

function readAtom(reader: Reader): MalType {
    const token = reader.next();
    return AtomFromToken(token);
}

function AtomFromToken(token: string): MalType {
    if (MalSymbol.has(token)) {
        return MalSymbol.get(token);
    } else if (token.startsWith(":")) {
        return MalKeyword.get(token.substr(1));
    } else if (token.match(MalTypeRegex.integer)) {
        return new MalNumber(parseInt(token, 10));
    } else if (token.match(MalTypeRegex.float)) {
        return new MalNumber(parseFloat(token));
    } else if (token.match(MalTypeRegex.string)) {
        try {
            return new MalString(eval(token));
        } catch {
            throw new MalReadError(`invalid string ${token}`);
        }
    } else if (token.match(MalTypeRegex.variable)) {
        return MalSymbol.get(token);
    } else {
        throw new MalUnexpectedToken(token);
    }
}
