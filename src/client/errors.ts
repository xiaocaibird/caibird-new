/* eslint-disable @typescript-eslint/parameter-properties */
import type { ApiDeclares } from './api-service';

export class ApiError extends Error {
    public constructor(public readonly responseBody: ApiDeclares.Response) {
        super(responseBody.message);
    }
}
