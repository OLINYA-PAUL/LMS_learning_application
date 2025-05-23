"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersAnalysis = exports.getCoursesAnalysis = exports.getUsersAnalysis = void 0;
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const analytics_generator_1 = require("../utils/analytics.generator");
const user_models_1 = require("../models/user.models");
const course_model_1 = require("../models/course.model");
const order_model_1 = require("../models/order.model");
//get user analysis -- only for admin
exports.getUsersAnalysis = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    const userAanalysis = await (0, analytics_generator_1.generateLast12MonthData)(user_models_1.UserModel);
    if (!userAanalysis) {
        return next(new errorHandler_1.default("can't generate analysis for this users data", 400));
    }
    res.status(200).json({
        success: true,
        userAanalysis,
    });
});
exports.getCoursesAnalysis = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    const courseAanalysis = await (0, analytics_generator_1.generateLast12MonthData)(course_model_1.CourseModel);
    if (!courseAanalysis) {
        return next(new errorHandler_1.default("can't generate analysis for this courses data", 400));
    }
    res.status(200).json({
        success: true,
        courseAanalysis,
    });
});
exports.getOrdersAnalysis = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    const oderAanalysis = await (0, analytics_generator_1.generateLast12MonthData)(order_model_1.OrderModel);
    if (!oderAanalysis) {
        return next(new errorHandler_1.default("can't generate analysis for this orders data", 400));
    }
    res.status(200).json({
        success: true,
        oderAanalysis,
    });
});
