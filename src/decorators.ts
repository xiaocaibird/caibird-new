import type { InnerDeclares } from './@types/inner';

import type { Caibird } from './@types';
import { DEFAULTS, KEYS, TEXTS } from './consts';
import { SymbolUtils } from './utils';

export const getDefaultControllerConfig =
    (): Caibird.Controller.Config => ({
        filterConfigList: [],
        filterConfigWeightList: {},
        isInited: false,
        actionConfigs: {},
    });

export const Controller =
    (
        options: {
            suffix?: string,
        } = {},
    ) =>
    (target: Caibird.UninitController) => {
        const { suffix = DEFAULTS.ControllerSuffix } = options;

        if (suffix && !target.name.endsWith(suffix)) {
            throw new Error(
                TEXTS.ErrMsgTemplates.suffixIllegal({
                    target: suffix,
                }),
            );
        }

        const map: InnerDeclares.StrictRecord<string, true> = {};
        for (const actionName in target.prototype) {
            if (actionName !== KEYS.Constructor) {
                const lowercaseName = actionName.toLowerCase();
                if (map[lowercaseName]) {
                    throw new Error(
                        TEXTS.ErrMsgTemplates.actionIsExisted({
                            action: actionName,
                        }),
                    );
                }
                map[lowercaseName] = true;
            }
        }

        const config =
            SymbolUtils.getCommonValue(target) ?? getDefaultControllerConfig();

        config.isInited = true;

        SymbolUtils.defineMetadataCommonValue(target, config);
    };
