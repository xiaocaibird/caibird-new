/* eslint-disable @typescript-eslint/parameter-properties */
import type { Context } from 'koa';

export abstract class BaseController {
    public constructor(protected readonly ctx: Context) {}
}
