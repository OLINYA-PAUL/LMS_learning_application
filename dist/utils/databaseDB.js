"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDbUrl = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDbUrl = async (url) => {
    try {
        return await mongoose_1.default.connect(url, {
            serverSelectionTimeoutMS: 8000,
        });
    }
    catch (error) {
        // Check if error is an instance of Error
        if (error instanceof Error) {
            console.log(error.message);
        }
        else {
            setTimeout(() => {
                console.log("An unexpected error occurred:", error);
            }, 5000);
        }
    }
};
exports.connectDbUrl = connectDbUrl;
