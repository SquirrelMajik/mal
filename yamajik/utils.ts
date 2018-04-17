export function isInstance(instance: any, classType: any): boolean {
    return instance instanceof classType;
}

export function* groupArray(array: Array<any>, chunkSize: number = 2): IterableIterator<Array<any>> {
    for (let i = 0; i < array.length; i += chunkSize) {
        yield array.slice(i, i + chunkSize);
    }
}

export function* chain(...arrays: Array<any>): IterableIterator<any> {
    for (const array of arrays) {
        yield* array;
    }
}
