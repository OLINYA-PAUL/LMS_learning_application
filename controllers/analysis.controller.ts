import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler";
import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import { generateLast12MonthData } from "../utils/analytics.generator";
import { UserModel } from "../models/user.models";
import { CourseModel } from "../models/course.model";
import { OrderModel } from "../models/order.model";

//get user analysis -- only for admin

export const getUsersAnalysis = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const userAanalysis = await generateLast12MonthData(UserModel);

    if (!userAanalysis) {
      return next(
        new ErrorHandler("can't generate analysis for this users data", 400)
      );
    }

    res.status(200).json({
      success: true,
      userAanalysis,
    });
  }
);

export const getCoursesAnalysis = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const courseAanalysis = await generateLast12MonthData(CourseModel);

    if (!courseAanalysis) {
      return next(
        new ErrorHandler("can't generate analysis for this courses data", 400)
      );
    }

    res.status(200).json({
      success: true,
      courseAanalysis,
    });
  }
);

export const getOrdersAnalysis = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const oderAanalysis = await generateLast12MonthData(OrderModel);

    if (!oderAanalysis) {
      return next(
        new ErrorHandler("can't generate analysis for this orders data", 400)
      );
    }

    res.status(200).json({
      success: true,
      oderAanalysis,
    });
  }
);
