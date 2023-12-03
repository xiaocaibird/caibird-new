import type { Context, Next } from 'koa';
import type { KoaBodyMiddlewareOptions } from 'koa-body';
import type koaViews from '@ladjs/koa-views';

import type { InnerDeclares } from './inner';
import type { KEYS } from '../consts';
import type { BaseActionReturn } from '../response';

export declare namespace Caibird {
    namespace Response {
        type BaseJsonBody = {
            data: Action.ResData,
            code: number | string,
            message?: string,
        };

        type JsonBody = BaseJsonBody & CustomJsonBody;

        interface CustomJsonBody {}
    }

    type CommonSymbolData<T = unknown> = {
        [KEYS.Symbols.Common]: T,
    };

    type PartialCommonSymbolData<T = unknown> = Partial<CommonSymbolData<T>>;

    type GetCommonSymbolValue<T> = T extends CommonSymbolData<infer R>
        ? R
        : T extends PartialCommonSymbolData<infer R>
        ? R | undefined
        : never;

    type UninitController = Function &
        InnerDeclares.Class<object, [ctx: any]> &
        PartialCommonSymbolData<Controller.Config>;

    type Controller = CommonSymbolData<Controller.Config> &
        Function &
        InnerDeclares.Class<object, [ctx: any]>;

    type UninitControllers = InnerDeclares.StrictRecord<
        string,
        UninitController
    >;

    namespace Controller {
        type Config = TargetConfig & {
            isInited: boolean,
            actionConfigs: InnerDeclares.StrictRecord<string, Action.Config>,
        };
    }

    type Action = InnerDeclares.Func<
        InnerDeclares.MayPromise<Action.Return>,
        [reqData?: any]
    >;

    namespace Action {
        type Config = TargetConfig;

        type ReqData = object | null | undefined;

        type ResData = boolean | number | object | string | null | undefined;

        type Return = BaseActionReturn | ResData;
    }

    namespace Filter {
        type HookArgs<T> = [
            param: T,
            ctx: Context,
            filterConfig: BindConfig,
            options: CommonOptionos,
        ];

        type Hooks<T> = {
            preAction?: InnerDeclares.Func<
                InnerDeclares.MayPromise<unknown>,
                HookArgs<T>
            >,
            postAction?: InnerDeclares.Func<
                InnerDeclares.MayPromise<unknown>,
                HookArgs<T>
            >,
        };

        type BindConfig = {
            name: string,
            weight: number,
            param: unknown,
            hooks: Hooks<any>,
            self: InnerDeclares.Func,
        };

        type CommonOptionos = {
            Controller: Controller,
            targetInfo:
                | TargetInfo<'Action'>
                | TargetInfo<'Controller'>
                | TargetInfo<'Global'>,
        };
    }

    namespace Middleware {
        type Options = {
            Controllers: UninitControllers,

            prefix?: string,
            controllerSuffix?: string,
            defaultPathMatchs?: RoutePathMatchs,
            globalFilters?: Filter.BindConfig[],
            successCode?: number,
            transformGetMethodJsonData?: {
                enabled: boolean,
                queryKey: string,
            },
            getRequestData?: (
                nowReqData: object,
                ctx: Context,
            ) => InnerDeclares.MayPromise<object>,
            onResponse?: (
                ctx: Context,
                next: Next,
            ) => InnerDeclares.MayPromise<void>,
            getJsonBody?: (
                nowJsonBody: object,
                context: Context,
            ) => InnerDeclares.MayPromise<object>,
            koaBodyOptions?: Partial<KoaBodyMiddlewareOptions> | false,
            koaViewsOptions?: false | (Parameters<typeof koaViews>[1] & { root?: string }),
        };

        type RoutePathMatchs = {
            controller?: string,
            action?: string,
        };
    }

    type TargetConfig = {
        filterConfigList: Filter.BindConfig[],
        filterConfigWeightList: InnerDeclares.StrictRecord<
            string,
            Filter.BindConfig[]
        >,
    };

    type TargetKind = 'Action' | 'Controller' | 'Global';

    type TargetInfo<T extends TargetKind> = {
        name: string,
        kind: T,
        config: T extends 'Global'
            ? undefined
            : T extends 'Controller'
            ? Controller.Config
            : Action.Config,
    };

    type HttpMethod = 'DELETE' | 'GET' | 'OPTIONS' | 'POST' | 'PUT';
}
