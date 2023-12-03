import type { Caibird } from './@types';
import { KEYS, TEXTS } from './consts';
import { getDefaultControllerConfig } from './decorators';
import { SymbolUtils } from './utils';

export const createFilter = <TParam>(
    name: string,
    hooks: Caibird.Filter.Hooks<TParam>,
    options: {
        defaultWeight?: number,
        onBind?: (
            param: TParam,
            filterConfig: Caibird.Filter.BindConfig,
            opt: Caibird.Filter.CommonOptionos,
        ) => void,
    } = {},
) => {
    type Args = undefined extends TParam
        ? [param?: TParam | null, weight?: number]
        : [param: TParam, weight?: number];

    type Return<TObj extends object | undefined> = undefined extends TObj
        ? Caibird.Filter.BindConfig
        : undefined;

    const filter =
        (...args: Args) =>
        <TObj extends object | undefined>(
            obj?: TObj,
            actionName?: string,
        ): Return<TObj> => {
            const param = args[0] ?? undefined;
            const weight = args[1] ?? options.defaultWeight ?? 0;

            const filterConfig: Caibird.Filter.BindConfig = {
                name,
                weight,
                param,
                hooks,
                self: filter,
            };

            if (obj) {
                let Controller;
                let targetKind: Caibird.TargetKind;
                if (actionName && KEYS.Constructor in obj) {
                    Controller =
                        obj.constructor as Caibird.UninitController;
                    targetKind = 'Action';
                } else {
                    Controller = obj as Caibird.UninitController;
                    targetKind = 'Controller';
                }

                const controllerConfig =
                    SymbolUtils.getCommonValue(Controller) ??
                    getDefaultControllerConfig();

                let targetConfig;

                if (!actionName) {
                    if (
                        controllerConfig.filterConfigList.find(
                            item => item.self === filter,
                        )
                    ) {
                        throw new Error(
                            TEXTS.ErrMsgTemplates.targetIsExisted({
                                target: name,
                            }),
                        );
                    }

                    controllerConfig.filterConfigList.push(filterConfig);
                    controllerConfig.filterConfigWeightList[weight] ??= [];
                    controllerConfig.filterConfigWeightList[weight]?.push(
                        filterConfig,
                    );

                    targetConfig = controllerConfig;
                } else {
                    const actionLowerCaseName = actionName.toLowerCase();

                    const actionConfig = controllerConfig.actionConfigs[
                        actionLowerCaseName
                    ] ?? {
                        filterConfigList: [],
                        filterConfigWeightList: {},
                    };

                    if (
                        actionConfig.filterConfigList.find(
                            item => item.self === filter,
                        )
                    ) {
                        throw new Error(
                            TEXTS.ErrMsgTemplates.targetIsExisted({
                                target: name,
                            }),
                        );
                    }

                    actionConfig.filterConfigList.push(filterConfig);
                    actionConfig.filterConfigWeightList[weight] ??= [];
                    actionConfig.filterConfigWeightList[weight]?.push(
                        filterConfig,
                    );

                    controllerConfig.actionConfigs[actionLowerCaseName] =
                        actionConfig;

                    targetConfig = actionConfig;
                }

                SymbolUtils.defineMetadataCommonValue(
                    Controller,
                    controllerConfig,
                );

                options.onBind?.(param as TParam, filterConfig, {
                    Controller: Controller as Caibird.Controller,
                    targetInfo: {
                        name: actionName ?? Controller.name,
                        kind: targetKind,
                        config: targetConfig,
                    } as Caibird.Filter.CommonOptionos['targetInfo'],
                });

                return undefined as Return<TObj>;
            }

            return filterConfig as Return<TObj>;
        };

    return filter;
};
