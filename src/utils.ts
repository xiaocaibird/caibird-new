/* eslint-disable @typescript-eslint/parameter-properties */
// eslint-disable-next-line import/no-unassigned-import
import 'reflect-metadata';

import type { InnerDeclares } from './@types/inner';

import type { Caibird } from './@types';
import { KEYS } from './consts';

export namespace SymbolUtils {
    export const getCommonValue = <
        T extends Caibird.PartialCommonSymbolData,
    >(
        target: T,
    ) => target[KEYS.Symbols.Common] as Caibird.GetCommonSymbolValue<T>;

    export const setCommonValue = <
        T extends Caibird.PartialCommonSymbolData,
    >(
        target: T,
        value: Caibird.GetCommonSymbolValue<T>,
    ) => {
        target[KEYS.Symbols.Common] = value;
    };

    export const defineMetadataCommonValue = <T>(
        target: Caibird.PartialCommonSymbolData,
        value: T,
    ) => {
        if (!(KEYS.Symbols.Common in target)) {
            Object.defineProperty(target, KEYS.Symbols.Common, {
                get(this: object) {
                    return Reflect.getOwnMetadata(
                        KEYS.Symbols.Common,
                        this,
                    ) as T;
                },
            });
        }
        Reflect.defineMetadata(KEYS.Symbols.Common, value, target);
    };
}

export namespace TaskUtils {
    export const sleep = async (delay: number) =>
        new Promise<undefined>(resolve => {
            setTimeout(() => {
                resolve(undefined);
            }, delay);
        });

    const CONSTS = {
        DefaultRetryTimes: 3,
    };

    class RetryError extends Error {
        public constructor(
            public readonly errors: unknown[],
            public readonly conut: number,
            public readonly params: Parameters<typeof retry>,
        ) {
            super();
        }
    }

    export const retry = async <T extends () => unknown>(
        task: T,
        options: {
            total?: number,
            delay?: number,
            throwAllErrors?: boolean,
            shouldRetry?: (params: {
                error: unknown,
                count: number,
            }) => InnerDeclares.MayPromise<boolean>,
        } = {},
    ) => {
        const {
            total = CONSTS.DefaultRetryTimes,
            throwAllErrors,
            delay,
            shouldRetry,
        } = options;

        const errors: unknown[] = [];
        let count;

        for (count = 1; count <= total; count++) {
            try {
                return (await task()) as ReturnType<T>;
            } catch (e: unknown) {
                errors.push(e);
                if (!shouldRetry || (await shouldRetry({ error: e, count }))) {
                    if (delay != null) {
                        await sleep(delay);
                    }
                } else {
                    break;
                }
            }
        }

        if (throwAllErrors) {
            throw new RetryError(errors, count, [task, options]);
        }

        throw errors.pop();
    };
}
