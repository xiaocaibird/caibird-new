export class JsonError extends Error {
    public constructor(public readonly code: number, message?: string) {
        super(message);
    }
}
export class StatusError extends Error {
    public constructor(public readonly status: number, message?: string) {
        super(message);
    }
}
