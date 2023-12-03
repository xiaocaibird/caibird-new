/* eslint-disable @typescript-eslint/parameter-properties */
import type { Context } from 'koa';
import koaSend, { type SendOptions } from 'koa-send';

import type { EasytsDeclares } from './@types';
import { DEFAULTS, HTTP_STATUS, KEYS } from './consts';

export abstract class BaseActionReturn {
    public readonly [KEYS.Symbols.ActionReturn] = 'BaseActionReturn';
}

export class RedirectActionReturn extends BaseActionReturn {
    public constructor(public readonly url: string) {
        super();
    }
}

export class StaticFileActionReturn extends BaseActionReturn {
    public constructor(
        public readonly filePath: string,
        public readonly options?: SendOptions,
    ) {
        super();
    }
}

export class RenderActionReturn<T extends object> extends BaseActionReturn {
    public constructor(
        public readonly viewPath: string,
        public readonly params?: T,
    ) {
        super();
    }
}

export class BufferActionReturn extends BaseActionReturn {
    public constructor(
        public readonly buffer: globalThis.Buffer,
        public readonly fileName: string,
        public readonly options?: { disposition: 'attachment' | 'inline' },
    ) {
        super();
    }
}

export class XmlActionReturn extends BaseActionReturn {
    public constructor(public readonly xmlContent: string) {
        super();
    }
}

export class NoopActionReturn extends BaseActionReturn {
    public constructor() {
        super();
    }
}

export namespace View {
    export const Redirect = (
        ...args: ConstructorParameters<typeof RedirectActionReturn>
    ) => new RedirectActionReturn(...args);

    export const StaticFile = (
        ...args: ConstructorParameters<typeof StaticFileActionReturn>
    ) => new StaticFileActionReturn(...args);

    export const Render = <T extends object>(
        ...args: ConstructorParameters<typeof RenderActionReturn<T>>
    ) => new RenderActionReturn<T>(...args);

    export const Buffer = (
        ...args: ConstructorParameters<typeof BufferActionReturn>
    ) => new BufferActionReturn(...args);

    export const Xml = (
        ...args: ConstructorParameters<typeof XmlActionReturn>
    ) => new XmlActionReturn(...args);

    export const Noop = (
        ...args: ConstructorParameters<typeof NoopActionReturn>
    ) => new NoopActionReturn(...args);
}

export namespace Response {
    export const Json = async (
        ctx: Context,
        data: EasytsDeclares.Action.ResData,
        code: number,
        message?: string,
        getJsonBody?: EasytsDeclares.Middleware.Options['getJsonBody'],
    ) => {
        if (ctx.headerSent) {
            return;
        }
        const json: EasytsDeclares.Response.BaseJsonBody = {
            code,
            data,
        };

        json.message = message;

        ctx.status = HTTP_STATUS.OK;
        ctx.type = 'json';

        if (getJsonBody) {
            ctx.body = await getJsonBody(json, ctx);
        } else {
            ctx.body = json;
        }
    };

    export const Status = (ctx: Context, status: number, message?: string) => {
        if (ctx.headerSent) {
            return;
        }
        ctx.body = message;
        ctx.status = status;
        ctx.type = 'html';
    };

    export const Action = async (
        result: EasytsDeclares.Action.Return,
        ctx: Context,
        successCode: number = DEFAULTS.SuccessCode,
        getJsonBody?: EasytsDeclares.Middleware.Options['getJsonBody'],
    ) => {
        if (ctx.headerSent) {
            return;
        }

        if (result instanceof NoopActionReturn) {
            return;
        }

        if (result instanceof RenderActionReturn) {
            await ctx.render(result.viewPath, result.params);
        } else if (result instanceof RedirectActionReturn) {
            ctx.redirect(result.url);
        } else if (result instanceof StaticFileActionReturn) {
            await koaSend(ctx, result.filePath, result.options);
        } else if (result instanceof BufferActionReturn) {
            ctx.set(
                'Content-Disposition',
                `${
                    result.options?.disposition ?? 'attachment'
                };filename=${encodeURIComponent(result.fileName)}`,
            );
            ctx.body = result.buffer;
            ctx.status = HTTP_STATUS.OK;
        } else if (result instanceof XmlActionReturn) {
            ctx.body = result.xmlContent;
            ctx.status = HTTP_STATUS.OK;
            ctx.type = 'xml';
        } else {
            await Json(ctx, result, successCode, undefined, getJsonBody);
        }
    };
}
