"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class errorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        const errorTraceStack = Error.captureStackTrace(this, this.constructor);
        console.log(errorTraceStack);
    }
}
exports.default = errorHandler;
