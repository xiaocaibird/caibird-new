import type { EasytsDeclares } from './@types';
import { HTTP_STATUS } from './consts';
import { createFilter } from './create-filter';
import { StatusError } from './errors';

export const httpMethodFilter = createFilter('httpMethodFilter', {
    preAction: (param: EasytsDeclares.HttpMethod | EasytsDeclares.HttpMethod [], ctx) => {
        const allowMethods = param instanceof Array ? param : [param];
        const currentMethod = ctx.method;
        if (
            !allowMethods
                .map(item => item.toLowerCase())
                .includes(currentMethod.toLowerCase())
        ) {
            throw new StatusError(HTTP_STATUS.NotFound, 'not found!');
        }
    },
});
