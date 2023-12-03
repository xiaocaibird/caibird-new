import Router from '@koa/router';
import type Application from 'koa';
import koaBody from 'koa-body';
import koaViews from '@ladjs/koa-views';

import type { InnerDeclares } from './@types/inner';

import type { Caibird } from './@types';
import { checkAction } from './check-action';
import { DEFAULTS, HTTP_STATUS, TEXTS } from './consts';
import { JsonError, StatusError } from './errors';
import { Response } from './response';
import { SymbolUtils } from './utils';

export const innerControllersRouter = (
    options: Caibird.Middleware.Options,
    app?: Application,
) => {
    const {
        prefix,
        controllerSuffix = DEFAULTS.ControllerSuffix,
        defaultPathMatchs = {},
        successCode,
        Controllers: oriControllers,
        transformGetMethodJsonData,
        onResponse,
        getRequestData,
        getJsonBody,
        globalFilters,
        koaBodyOptions,
        koaViewsOptions,
    } = options;

    koaBodyOptions !== false && app?.use(koaBody(koaBodyOptions));
    koaViewsOptions !== false &&
        app?.use(
            koaViews(koaViewsOptions?.root ?? process.cwd(), koaViewsOptions),
        );

    let controllers = oriControllers;

    const convertControllers: Caibird.UninitControllers = {};

    for (const propName in controllers) {
        const lowercaseName = propName
            .replace(new RegExp(`${controllerSuffix}$`), '')
            .toLowerCase();
        if (convertControllers[lowercaseName]) {
            throw new Error(
                TEXTS.ErrMsgTemplates.controllerIsExisted({
                    controller: propName,
                }),
            );
        }
        convertControllers[lowercaseName] = controllers[propName];
    }

    controllers = convertControllers;

    const router = new Router({
        prefix,
    });

    router.all('/:controller?/:action?/:value*', async (ctx, next) => {
        try {
            const {
                controller: controllerName = defaultPathMatchs.controller,
                action: actionName = defaultPathMatchs.action,
            } = ctx.params as Caibird.Middleware.RoutePathMatchs;

            if (!controllerName || !actionName) {
                await next();
                return;
            }

            const controllerLowerCaseName = controllerName.toLowerCase();

            const ControllerConstructor = controllers[controllerLowerCaseName];
            if (!ControllerConstructor) {
                await next();
                return;
            }

            const config = SymbolUtils.getCommonValue(ControllerConstructor);

            if (!config?.isInited) {
                await next();
                return;
            }

            const controllerInstance = new ControllerConstructor(ctx);

            const actionInfo = checkAction(
                ControllerConstructor as Caibird.Controller,
                actionName,
                ctx,
                globalFilters,
            );

            if (actionInfo === false) {
                await next();
                return;
            }

            for (const execInfo of actionInfo.execList) {
                await execInfo.hooks.preAction?.(...execInfo.args);
            }

            const body = ctx.request.body as object;
            const query = ctx.request.query as object;

            let reqData = { ...query, ...body };

            if (ctx.method.toLowerCase() === 'get') {
                const { enabled, queryKey } = transformGetMethodJsonData ?? {};
                if (enabled && queryKey) {
                    let urlJson = {};

                    try {
                        urlJson = JSON.parse(
                            (ctx.query[queryKey] ?? '').toString(),
                        ) as object;
                    } catch {}

                    reqData = {
                        ...reqData,
                        ...urlJson,
                    };

                    if (queryKey in reqData) {
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete (reqData as InnerDeclares.IndexObject)[queryKey];
                    }
                }
            }

            if (getRequestData) {
                reqData = await getRequestData(reqData, ctx);
            }

            const actionReturn = await actionInfo.actionBody.call(
                controllerInstance,
                reqData,
            );

            for (const execInfo of actionInfo.execList) {
                await execInfo.hooks.postAction?.(...execInfo.args);
            }

            await Response.Action(actionReturn, ctx, successCode, getJsonBody);
        } catch (e: unknown) {
            const err = e ?? new Error('未知错误！');
            if (err instanceof JsonError) {
                await Response.Json(
                    ctx,
                    undefined,
                    err.code,
                    err.message,
                    getJsonBody,
                );
            } else if (err instanceof StatusError) {
                Response.Status(ctx, err.status, err.message);
            } else {
                Response.Status(
                    ctx,
                    HTTP_STATUS.ServerError,
                    (err as Error).message,
                );
            }
        }

        await onResponse?.(ctx, next);
    });

    return router.routes();
};

export const controllersRouter = (
    options: Caibird.Middleware.Options,
    app: Application,
) => innerControllersRouter(options, app);
