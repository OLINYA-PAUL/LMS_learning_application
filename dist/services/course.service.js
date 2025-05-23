"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAdminCourses = exports.createCourse = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const course_model_1 = require("../models/course.model");
exports.createCourse = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (data, res, next) => {
    try {
        const course = await course_model_1.CourseModel.create(data);
        if (!course) {
            return next(new errorHandler_1.default("Cannot create course", 400));
        }
        course.save();
        res.status(201).json({
            success: true,
            message: "course uploaded successfully!",
            course,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
const getAllAdminCourses = async (res, next) => {
    try {
        const courses = await course_model_1.CourseModel.find({}).sort({ createdAt: -1 });
        if (!courses)
            return "No Courses found";
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
};
exports.getAllAdminCourses = getAllAdminCourses;
