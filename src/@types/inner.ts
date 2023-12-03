export declare namespace InnerDeclares {
    type IndexKeys = keyof any;

    type StrictOmit<T, K extends keyof T> = Omit<T, K>;

    type StrictPick<T, K extends keyof T> = Pick<T, K>;

    type StringLike = number | string;

    type IndexObject = Record<string, unknown>;

    type AbstractClass<R = object, A extends unknown[] = any> = abstract new (
        ...args: A
    ) => R;

    type Func<R = unknown, A extends unknown[] = any> = (...args: A) => R;
    type Class<R = object, A extends unknown[] = any> = new (...args: A) => R;

    type NoUndefined<T> = T extends undefined ? never : T;

    type StrictRecord<K extends IndexKeys, T> = {
        [P in K]?: T;
    };

    type MayPromise<T> = Promise<T> | T;

    type NullableIfAllow<T> = T extends undefined
    ? T | null
    : T extends null
    ? T | undefined
    : T;
}
