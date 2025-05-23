"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsyncErroMiddleWare = void 0;
const catchAsyncErroMiddleWare = (errorFunction) => (req, res, next) => {
    return Promise.resolve(errorFunction(req, res, next)).catch((err) => next(err));
};
exports.catchAsyncErroMiddleWare = catchAsyncErroMiddleWare;
