import { NextFunction, Response } from "express";
import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import errorHandler from "../utils/errorHandler";
import { CourseModel } from "../models/course.model";

export const createCourse = catchAsyncErroMiddleWare(
  async (data: any, res: Response, next: NextFunction) => {
    try {
      const course = await CourseModel.create(data);
      if (!course) {
        return next(new errorHandler("Cannot create course", 400));
      }

      course.save();
      res.status(201).json({
        success: true,
        message: "couser created successfully!",
        course,
      });
    } catch (error: any) {
      return next(new errorHandler(error.message, 400));
    }
  }
);
