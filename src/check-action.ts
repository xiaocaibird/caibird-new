import type { Context } from 'koa';
import orderBy from 'lodash/orderBy';

import type { InnerDeclares } from './@types/inner';

import type { Caibird } from './@types';
import { KEYS } from './consts';
import { SymbolUtils } from './utils';

export const checkAction = (
    Controller: Caibird.Controller,
    actionName: string,
    ctx: Context,
    globalFilters: Caibird.Filter.BindConfig[] = [],
) => {
    let actionBody = null;
    const actionLowerCaseName = actionName.toLowerCase();

    if (actionLowerCaseName === KEYS.Constructor) return false;

    for (const propName of Object.getOwnPropertyNames(Controller.prototype)) {
        if (propName.toLowerCase() === actionLowerCaseName) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            actionBody = Controller.prototype[propName] as Caibird.Action;
            if (typeof actionBody !== 'function') return false;
            break;
        }
    }

    if (!actionBody) return false;

    const controllerConfig = SymbolUtils.getCommonValue(Controller);
    const actionConfig = controllerConfig.actionConfigs[actionLowerCaseName];

    const filterList: InnerDeclares.Func[] = [];
    const execList: {
        hooks: Caibird.Filter.BindConfig['hooks'],
        args: Caibird.Filter.HookArgs<unknown>,
    }[] = [];

    if (actionConfig) {
        const actionFilterConfigWeightList =
            actionConfig.filterConfigWeightList;

        const actionWeightKeys = orderBy(
            Object.keys(actionFilterConfigWeightList),
        ).reverse();
        for (const weight of actionWeightKeys) {
            const filterConfigs = actionFilterConfigWeightList[weight] ?? [];
            for (const config of filterConfigs) {
                filterList.push(config.self);
                execList.push({
                    hooks: config.hooks,
                    args: [
                        config.param,
                        ctx,
                        config,
                        {
                            Controller,
                            targetInfo: {
                                name: actionName,
                                kind: 'Action',
                                config: actionConfig,
                            },
                        },
                    ],
                });
            }
        }
    }

    const controllerFilterConfigWeightList =
        controllerConfig.filterConfigWeightList;

    const controllerWeightKeys = orderBy(
        Object.keys(controllerFilterConfigWeightList),
    ).reverse();
    for (const weight of controllerWeightKeys) {
        const filterConfigs = controllerFilterConfigWeightList[weight] ?? [];
        for (const config of filterConfigs) {
            if (!filterList.find(item => item === config.self)) {
                filterList.push(config.self);
                execList.push({
                    hooks: config.hooks,
                    args: [
                        config.param,
                        ctx,
                        config,
                        {
                            Controller,
                            targetInfo: {
                                name: Controller.name,
                                kind: 'Controller',
                                config: controllerConfig,
                            },
                        },
                    ],
                });
            }
        }
    }

    const globalFilterConfigs = globalFilters.sort(
        (a, b) => b.weight - a.weight,
    );

    for (const config of globalFilterConfigs) {
        if (!filterList.find(item => item === config.self)) {
            execList.push({
                hooks: config.hooks,
                args: [
                    config.param,
                    ctx,
                    config,
                    {
                        Controller,
                        targetInfo: {
                            name: 'global',
                            kind: 'Global',
                            config: undefined,
                        },
                    },
                ],
            });
        }
    }

    return { actionBody, execList };
};
