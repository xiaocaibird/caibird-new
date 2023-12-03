export namespace KEYS {
    export namespace Symbols {
        export const Common = Symbol('Common');
        export const ActionReturn = Symbol('ActionReturn');
    }

    export const Constructor = 'constructor';
}

export const HTTP_STATUS = {
    OK: 200,
    ServerError: 500,
    NotFound: 404,
} as const;

export namespace TEXTS {
    export const ErrMsgTemplates = {
        targetIsRequired: ({ target }: { target: string }) =>
            `The ${target} is required!` as const,
        targetIsExisted: ({ target }: { target: string }) =>
            `The ${target} is existed!` as const,
        controllerIsExisted: ({ controller }: { controller: string }) =>
            `The ${controller} is existed! The Controller's name is ignore case!` as const,
        actionIsExisted: ({ action }: { action: string }) =>
            `The ${action} is existed! The Action's name is ignore case!` as const,
        targetIsUninit: ({ target }: { target: string }) =>
            `The ${target} is uninit!` as const,
        targetIsNotFound: ({ target }: { target: string }) =>
            `The ${target} is not found!` as const,
        targetIsIllegal: ({ target }: { target: string }) =>
            `The ${target} is illegal!` as const,
        targetIsNoDefine: ({ target }: { target: string }) =>
            `The ${target} is no define!` as const,
        taskIsTimeout: ({ task }: { task: string }) =>
            `The ${task} is timeout!` as const,
        suffixIllegal: ({
            target,
            suffix,
        }: {
            target: string,
            suffix?: string,
        }) => `The ${target} must endsWith ${suffix ?? target}` as const,
    };
}

export const DEFAULTS = {
    LoadToAppProperty: 'caibird-controller',
    ControllerDir: 'app/controller',
    ControllerSuffix: 'Controller',
    SuccessCode: 0,
} as const;
