import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import Formdata from 'form-data';
import urlJoin from 'url-join';

import type { InnerDeclares } from '../@types/inner';
import type { EasytsDeclares } from '../@types';
import { DEFAULTS, type KEYS } from '../consts';
import { TaskUtils } from '../utils';

import { ApiError } from './errors';

enum ContentType {
    Text = 'text/plain;charset=utf-8',
    JSON = 'application/json',
    Form = 'application/x-www-form-urlencoded',
    XML = 'application/xml',
    Multipart = 'multipart/form-data',
}
enum HeaderKeys {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    ContentType = 'Content-Type',
}

export declare namespace ApiDeclares {
    type ReqData = EasytsDeclares.Action.ReqData;
    type ResData = EasytsDeclares.Action.ResData;

    type RequestConfig<TReqData = ReqData> = AxiosRequestConfig<TReqData>;
    type RawResponse<TResData = ResData, TReqData = ReqData> = AxiosResponse<
        TResData,
        TReqData
    >;

    type SuccessCodes = (number | string)[];

    type Options = Options.CommonOptions;

    namespace Options {
        type IsRaw = boolean | undefined;

        type BaseCallFuncParams = {
            reqData: ReqData,
            controllerName: string,
            actionName: string,
        };

        type ValueType = boolean | number | object | string | null | undefined;

        type ValueOrFunc<V extends ValueType, P extends object> =
            | V
            | ((params: P) => InnerDeclares.MayPromise<V>);

        type PreCallFuncParams = BaseCallFuncParams & {
            callOptions: ActionCallOptions,
            url: string,
        };

        type OmitUrlPreCallFuncParams = InnerDeclares.StrictOmit<
            PreCallFuncParams,
            'url'
        >;

        type PreCallValueOrFunc<V extends ValueType> = ValueOrFunc<
            V,
            PreCallFuncParams
        >;

        type PostCallFuncParams = PreCallFuncParams & {
            finallyRequestConfig: RequestConfig,
            rawResponse: RawResponse,
        };

        type BaseRequestConfig = InnerDeclares.StrictOmit<
            RequestConfig,
            'data' | 'params' | 'url'
        >;

        type CommonOptions = {
            retry?: number,
            // 内部逻辑
            origin?: ValueOrFunc<string, OmitUrlPreCallFuncParams>,
            prefix?: ValueOrFunc<string, OmitUrlPreCallFuncParams>,
            successCodes?: ValueOrFunc<SuccessCodes, PostCallFuncParams>,

            // 覆盖
            timeout?: PreCallValueOrFunc<number>,
            httpMethod?: PreCallValueOrFunc<EasytsDeclares.HttpMethod>,

            // 合并
            headers?: PreCallValueOrFunc<Record<string, number | string>>,
            commonReqData?: PreCallValueOrFunc<ReqData>, // TODO 类型完善
            baseRequestConfig?: PreCallValueOrFunc<BaseRequestConfig>,

            transformGetMethodJsonData?: {
                enabled: boolean,
                queryKey: string,
            },

            // 回调
            getFinallyRequestConfig?: (
                params: PreCallFuncParams & {
                    nowRequestConfig: RequestConfig,
                },
            ) => InnerDeclares.MayPromise<RequestConfig>,
            onReturnResponse?: (
                params: PostCallFuncParams,
            ) => InnerDeclares.MayPromise<Response<ResData, RawResponse>>,
            onError?: (
                error: unknown,
                params: OmitUrlPreCallFuncParams,
            ) => InnerDeclares.MayPromise<unknown>,
        };

        type ActionCallOptions<TIsRaw extends IsRaw = IsRaw> = CommonOptions & {
            isRaw?: TIsRaw,
            isFormData?: boolean,
        };
    }

    type GetCallAction<
        TReqData,
        TResData extends ResData,
    > = unknown extends TReqData
        ? never
        : object extends TReqData
        ? <TIsRaw extends boolean | undefined = undefined>(
              reqData?: TReqData | null,
              opt?: Options.ActionCallOptions<TIsRaw>,
          ) => TIsRaw extends true
              ? Promise<
                    Response<
                        TResData,
                        TReqData extends object ? TReqData : null
                    >
                >
              : Promise<TResData>
        : TReqData extends object
        ? <TIsRaw extends boolean | undefined = undefined>(
              reqData: TReqData,
              opt?: Options.ActionCallOptions<TIsRaw>,
          ) => TIsRaw extends true
              ? Promise<Response<TResData, TReqData>>
              : Promise<TResData>
        : <TIsRaw extends boolean | undefined = undefined>(
              reqData?: null,
              opt?: Options.ActionCallOptions<TIsRaw>,
          ) => TIsRaw extends true
              ? Promise<Response<TResData, undefined>>
              : Promise<TResData>;

    type GetCallByControllers<
        T extends Controllers,
        TControllerSuffix extends string = DefaultControllerSuffix,
        V extends keyof T = keyof T,
    > = {
        [C in V extends `${infer K}${TControllerSuffix}` ? K : never]: {
            [M in keyof T[`${C}${TControllerSuffix}`]]: T[`${C}${TControllerSuffix}`][M] extends ActionBody
                ? GetCallAction<
                      GetReq<Parameters<T[`${C}${TControllerSuffix}`][M]>>,
                      GetRes<ReturnType<T[`${C}${TControllerSuffix}`][M]>>
                  >
                : unknown;
        };
    } & {
        [C in V extends `${string}${TControllerSuffix}` ? never : V]: {
            [M in keyof T[C]]: T[C][M] extends ActionBody
                ? GetCallAction<
                      GetReq<Parameters<T[C][M]>>,
                      GetRes<ReturnType<T[C][M]>>
                  >
                : unknown;
        };
    };

    // 这里T extends unknown是为了处理any
    type GetCall<
        T extends Controllers,
        TControllerSuffix extends string,
    > = unknown extends T ? T : GetCallByControllers<T, TControllerSuffix>;

    // eslint-disable-next-line @typescript-eslint/ban-types
    type ControllerConstructor = Function & InnerDeclares.Class;
    type ControllerInstance = object;

    type ActionReturnInterface = {
        [KEYS.Symbols.ActionReturn]: string,
    };

    type ActionReturn = ActionReturnInterface | ResData;

    type ActionBody = InnerDeclares.Func<
        InnerDeclares.MayPromise<ActionReturn>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [any]
    >;
    type DefaultControllerSuffix = typeof DEFAULTS.ControllerSuffix;

    type Controllers = Record<string, ControllerInstance>;
    type ControllerConstructors = Record<string, ControllerConstructor>;

    type TransformControllerConstructors<T extends ControllerConstructors> = {
        [P in keyof T]: InnerDeclares.StrictPick<
            T[P]['prototype'],
            keyof T[P]['prototype']
        >;
    };

    type TransformControllers<T extends Controllers> = {
        [P in keyof T]: InnerDeclares.StrictPick<T[P], keyof T[P]>;
    };

    type GetLegalControllers<T> = unknown extends T
        ? T
        : {
              [P in keyof T]: T[P];
          };

    type TransformEntryControllers<T> = unknown extends T
        ? T
        : T extends ControllerConstructors
        ? TransformControllerConstructors<T>
        : T extends Controllers
        ? TransformControllers<T>
        : never;

    type IllegalControllersToNever<T> = T extends Controllers ? T : never;

    type GetReq<T extends [] | [unknown]> = T['length'] extends 0
        ? undefined
        : unknown extends T[0]
        ? undefined
        : T[0] extends object
        ? T[0]
        : unknown;

    type GetRes<T> = T extends InnerDeclares.MayPromise<ActionReturnInterface>
        ? undefined
        : T extends InnerDeclares.MayPromise<infer R>
        ? R
        : undefined;

    type Response<
        TRes extends ResData = ResData,
        TReq extends ReqData = ReqData,
    > = Response.Error<TRes, TReq> | Response.Success<TRes, TReq>;

    namespace Response {
        type Success<
            TRes extends ResData,
            TReq extends ReqData = ReqData,
        > = Base<TRes, TReq> & {
            data: TRes,
        };

        type Error<TRes extends ResData, TReq extends ReqData> = Base<
            TRes,
            TReq
        > & {
            data?: undefined,
        };

        type Base<TRes extends ResData, TReq extends ReqData> = Base.Custom & {
            code: number | string,
            message?: string,
            rawResponse: AxiosResponse<TRes, TReq>,
        };

        namespace Base {
            interface Custom {}
        }
    }
}

export class ApiService<
    TControllers,
    TControllerSuffix extends string = ApiDeclares.DefaultControllerSuffix,
> {
    public static readonly CONSTS = {
        Defaults: {
            SuccessCodes: [DEFAULTS.SuccessCode] as ApiDeclares.SuccessCodes,
            Retry: 0,
        },
    } as const;

    public constructor(options: ApiDeclares.Options = {}) {
        this.#options = options;
    }

    readonly #options;

    public readonly call = new Proxy<object>(
        {},
        {
            get: (_target, cName) =>
                new Proxy(
                    {},
                    {
                        get:
                            (_, aName) =>
                            async (
                                reqData?: ApiDeclares.ReqData,
                                callOptions: ApiDeclares.Options.ActionCallOptions = {},
                            ) => {
                                const onError = this.#getEffectiveValueOrFunc(
                                    'onError',
                                    callOptions,
                                );
                                const controllerName = cName
                                    .toString()
                                    .toLowerCase();
                                const actionName = aName
                                    .toString()
                                    .toLowerCase();
                                try {
                                    return await this.#handleCall(
                                        async () =>
                                            this.#axios(
                                                controllerName,
                                                actionName,
                                                reqData,
                                                callOptions,
                                            ),
                                        {
                                            reqData,
                                            controllerName,
                                            actionName,
                                            callOptions,
                                        },
                                    );
                                } catch (e: unknown) {
                                    if (onError) {
                                        // eslint-disable-next-line @typescript-eslint/return-await
                                        return await onError(e, {
                                            reqData,
                                            controllerName,
                                            actionName,
                                            callOptions,
                                        });
                                    }
                                    throw e;
                                }
                            },
                    },
                ),
        },
    ) as ApiDeclares.GetCall<
        ApiDeclares.IllegalControllersToNever<
            ApiDeclares.TransformEntryControllers<
                ApiDeclares.GetLegalControllers<TControllers>
            >
        >,
        TControllerSuffix
    >;

    async #getValueOrFuncResult<
        V extends ApiDeclares.Options.ValueType,
        P extends object,
    >(cb: ApiDeclares.Options.ValueOrFunc<V, P>, params: P) {
        const res = (typeof cb === 'function' ? await cb(params) : cb) as V;
        return res;
    }

    async #handleCall(
        callTask: () => Promise<{
            response: ApiDeclares.Response,
            successCodes?: ApiDeclares.SuccessCodes,
        }>,
        params: ApiDeclares.Options.BaseCallFuncParams & {
            callOptions: ApiDeclares.Options.ActionCallOptions | undefined,
        },
    ) {
        const { callOptions = {} } = params;

        const {
            response,
            successCodes = ApiService.CONSTS.Defaults.SuccessCodes,
        } = await callTask();

        if (callOptions.isRaw) return response;

        if (successCodes.includes(response.code)) return response.data;

        throw new ApiError(response);
    }

    #getEffectiveValueOrFunc<K extends keyof ApiDeclares.Options.CommonOptions>(
        k: K,
        callOptions: ApiDeclares.Options.ActionCallOptions,
    ) {
        return callOptions[k] ?? this.#options[k];
    }

    async #axios(
        controllerName: string,
        actionName: string,
        reqData?: ApiDeclares.ReqData,
        callOptions: ApiDeclares.Options.ActionCallOptions = {},
    ) {
        const originFuncParams: ApiDeclares.Options.OmitUrlPreCallFuncParams = {
            reqData,
            controllerName,
            actionName,
            callOptions,
        };

        const origin =
            (await this.#getValueOrFuncResult(
                this.#getEffectiveValueOrFunc('origin', callOptions),
                originFuncParams,
            )) ?? '';

        const prefix =
            (await this.#getValueOrFuncResult(
                this.#getEffectiveValueOrFunc('prefix', callOptions),
                originFuncParams,
            )) ?? '';

        const url = urlJoin(origin, prefix, controllerName, actionName);

        const preFuncParams: ApiDeclares.Options.PreCallFuncParams = {
            ...originFuncParams,
            url,
        };

        const baseRequestConfig: ApiDeclares.Options.BaseRequestConfig = {
            ...(await this.#getValueOrFuncResult(
                this.#options.baseRequestConfig,
                preFuncParams,
            )),
            ...(await this.#getValueOrFuncResult(
                callOptions.baseRequestConfig,
                preFuncParams,
            )),
        };

        const httpMethod =
            (await this.#getValueOrFuncResult(
                this.#getEffectiveValueOrFunc('httpMethod', callOptions),
                preFuncParams,
            )) ??
            (baseRequestConfig.method as EasytsDeclares.HttpMethod | undefined) ??
            'POST';

        const timeout =
            (await this.#getValueOrFuncResult(
                this.#getEffectiveValueOrFunc('timeout', callOptions),
                preFuncParams,
            )) ?? baseRequestConfig.timeout;

        const headers: ApiDeclares.RequestConfig['headers'] = {
            ...baseRequestConfig.headers,
            ...(await this.#getValueOrFuncResult(
                this.#options.headers,
                preFuncParams,
            )),
            ...(await this.#getValueOrFuncResult(
                callOptions.headers,
                preFuncParams,
            )),
        };

        let body = {
            ...(await this.#getValueOrFuncResult(
                this.#options.commonReqData,
                preFuncParams,
            )),
            ...(await this.#getValueOrFuncResult(
                callOptions.commonReqData,
                preFuncParams,
            )),
            ...reqData,
        };

        const isFormData = callOptions.isFormData;

        if (isFormData) {
            const formData = new Formdata();
            Object.entries(body).forEach(item =>
                formData.append(item[0], item[1]));
            body = formData;
        }

        const autoContentType = isFormData
            ? ContentType.Multipart
            : httpMethod === 'GET'
            ? ContentType.Form
            : httpMethod === 'POST'
            ? ContentType.JSON
            : undefined;

        let params;

        if (httpMethod === 'GET') {
            const { enabled, queryKey } =
                this.#options.transformGetMethodJsonData ?? {};
            if (enabled && queryKey) {
                params = {
                    [queryKey]: JSON.stringify(body),
                };
            } else {
                params = body;
            }
        }

        const nowRequestConfig: ApiDeclares.RequestConfig = {
            ...baseRequestConfig,

            timeout,
            method: httpMethod,

            url,

            headers: {
                [HeaderKeys.ContentType]: autoContentType,
                ...(body instanceof Formdata ? body.getHeaders() : undefined),
                ...headers,
            },
            params,
            data: httpMethod !== 'GET' ? body : undefined,
        };

        const getFinallyRequestConfig = this.#getEffectiveValueOrFunc(
            'getFinallyRequestConfig',
            callOptions,
        );
        const finallyRequestConfig = getFinallyRequestConfig
            ? await getFinallyRequestConfig({
                  ...preFuncParams,
                  nowRequestConfig,
              })
            : nowRequestConfig;

        const retry =
            this.#getEffectiveValueOrFunc('retry', callOptions) ??
            ApiService.CONSTS.Defaults.Retry;

        const rawResponse = await TaskUtils.retry(
            async () => axios(finallyRequestConfig),
            { total: retry + 1 },
        );

        const postFuncParams: ApiDeclares.Options.PostCallFuncParams = {
            ...preFuncParams,
            finallyRequestConfig,
            rawResponse,
        };

        const onReturnResponse = this.#getEffectiveValueOrFunc(
            'onReturnResponse',
            callOptions,
        );
        const response = onReturnResponse
            ? await onReturnResponse(postFuncParams)
            : ({
                  rawResponse,
                  ...rawResponse.data,
              } as ApiDeclares.Response);

        const successCodes = await this.#getValueOrFuncResult(
            this.#getEffectiveValueOrFunc('successCodes', callOptions),
            postFuncParams,
        );

        return { response, successCodes };
    }
}
