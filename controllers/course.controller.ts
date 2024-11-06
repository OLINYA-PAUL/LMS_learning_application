import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import { Request, Response, NextFunction } from "express";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorHandler";
import { createCourse } from "../services/course.service";
import { CourseModel } from "../models/course.model";
const createRedisClient = require("../utils/redis");

const redis = createRedisClient();

export const uploadCourse = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body as any;
      const thumbnail = data.thumbnails;

      if (thumbnail && typeof thumbnail === "string") {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnails = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      await createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const updateCourse = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const data = req.body;

      const thumbnailID = data.thumbnails;

      if (thumbnailID) {
        // Handle previous thumbnail deletion if `public_Id` exists
        await cloudinary.v2.uploader.destroy(thumbnailID);

        // Upload new thumbnail if `thumbnail` is a URL or file path
        const myCloud = await cloudinary.v2.uploader.upload(thumbnailID, {
          folder: "course",
        });

        // Update `data.thumbnail` with new Cloudinary details
        data.thumbnails = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      // Update the course with the modified data
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      if (!course) {
        return next(new ErrorHandler("Failed to update course", 400));
      }

      res.status(200).json({
        success: true,
        message: "Course updated successfully 😍",
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//get single course without purchase

export const getSingleCourse = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const isCahedExsit = await redis.get(courseId);
      if (isCahedExsit) {
        const courseCachedData = JSON.parse(isCahedExsit);

        res.status(200).json({
          success: true,
          courseCachedData,
        });
      } else {
        const course = await CourseModel.findById(courseId).select(
          "-courseData.description -courseData.videoUrl -courseData.link -courseData.suggestions -courseData.questions"
        );
        if (!course) {
          return next(new ErrorHandler("No course to show", 400));
        }

        await redis.set(courseId, JSON.stringify(course));
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//get all course without purchase

export const getAllleCourse = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCahedExsit = await redis.get("all-courses");
      if (isCahedExsit) {
        const courseCachedData = JSON.parse(isCahedExsit);

        res.status(200).json({
          success: true,
          courseCachedData,
        });
      } else {
        const course = await CourseModel.find({}).select(
          "-courseData.description -courseData.videoUrl -courseData.link -courseData.suggestions -courseData.questions"
        );
        if (!course) {
          return next(new ErrorHandler("No course to show", 400));
        }

        await redis.set("all-courses", JSON.stringify(course));
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
