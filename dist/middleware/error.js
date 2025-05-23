"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleWareHandler = void 0;
const errorHandler_1 = __importDefault(require("../utils/errorHandler")); // Assuming this is a class for handling custom errors
const errorMiddleWareHandler = (err, req, res, next) => {
    // Default error properties
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal server error";
    // Log the error for debugging (optional)
    console.error(err);
    // Handle invalid MongoDB ObjectId errors
    if (err.name === "CastError") {
        const message = `Resource not found. Invalid ${err.path}`;
        err = new errorHandler_1.default(message, 400); // 400 Bad Request
    }
    // Handle duplicate key errors in MongoDB (e.g., unique field constraints)
    if (err.code === 11000) {
        const message = `Duplicate value for ${Object.keys(err.keyValue)} entered`;
        err = new errorHandler_1.default(message, 400); // 400 Bad Request
    }
    // Handle invalid JWT errors
    if (err.name === "JsonWebTokenError") {
        const message = "Invalid JWT token, please try again";
        err = new errorHandler_1.default(message, 400); // 400 Bad Request
    }
    // Handle expired JWT errors
    if (err.name === "TokenExpiredError") {
        const message = "JWT token has expired, please try again";
        err = new errorHandler_1.default(message, 400); // 400 Bad Request
    }
    // Send the error response
    res.status(err.statusCode).json({
        success: false,
        error: err.message,
    });
};
exports.errorMiddleWareHandler = errorMiddleWareHandler;
