import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import { Request, Response, NextFunction } from "express";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorHandler";
import { createCourse, getAllUsersCourses } from "../services/course.service";
import { CourseModel } from "../models/course.model";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import { sendEmail } from "../utils/sendMail";
import { notificationModel } from "../models/notification.model";
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
        { new: true, upsert: true }
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
        const courses = JSON.parse(isCahedExsit);

        res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const course = await CourseModel.findById(courseId).select(
          "-courseData.description -courseData.videoUrl -courseData.link -courseData.suggestions -courseData.questions"
        );
        if (!course) {
          return next(new ErrorHandler("No course to show", 400));
        }

        await redis.set(courseId, JSON.stringify(course), "EX", 604800);

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
        const courses = JSON.parse(isCahedExsit);

        res.status(200).json({
          success: true,
          courses,
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

// only for user who purchase course only

export const getCourseByUser = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const getUserCourse = req.user?.courses!;
      const courseId = req.params.id;

      const findUserCourse = getUserCourse?.find((course) => {
        return course._id?.toString() === courseId.toString();
      });

      // if (!findUserCourse) {
      //   return next(
      //     new ErrorHandler("You are not authorized to view this content", 400)
      //   );
      // }

      const courseContent = await CourseModel.findById(courseId);
      if (!courseContent) {
        return next(new ErrorHandler("No course found", 400));
      }

      res.status(200).json({
        success: true,
        courseContent,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IAddQuestion {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestions = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId } = req.body as IAddQuestion;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Invalid course", 400));
      }

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content ID", 400));
      }

      const courseContent = course?.courseData.find((course: any) =>
        course._id.equals(contentId)
      );

      const addnewQuestion = {
        user: req.user,
        question,
        questionReplies: [],
      };

      courseContent?.question.push(addnewQuestion as any);

      await notificationModel.create({
        userId: req.user?._id,
        title: "New Question Received",
        message: `You have a new question from: ${courseContent?.title}`,
      });

      await course.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IAddAnswer {
  answer: string;
  questionId: string;
  courseId: string;
  contentId: string;
}

export const addAnswer = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, questionId, courseId, contentId } =
        req.body as IAddAnswer;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Invalid course", 400));
      }

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content ID", 400));
      }

      const courseContent = course?.courseData.find((course: any) =>
        course._id.equals(contentId)
      );

      if (!courseContent)
        return next(new ErrorHandler("Invalid content ID", 400));

      const question = courseContent.question.find((questionsId: any) =>
        questionsId._id.equals(questionId)
      );

      if (!question) return next(new ErrorHandler("Invalid question ID", 400));

      const addnewAnswer = {
        user: req.user,
        answer,
      } as any;

      question.questionReplies?.push(addnewAnswer) ?? [];
      await course.save();

      if (req.user?._id === question.user._id) {
        await notificationModel.create({
          userId: req.user?._id,
          title: "New Question Reply",
          message: `You have a new question from: ${courseContent?.title}`,
        });
      } else {
        const data = {
          name: req.user?.name,
          title: courseContent.title,
        };

        // render the data to EJS TEMPLATE
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );

        try {
          sendEmail({
            email: req.user?.email ?? "",
            subject: "Question Replies",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 400));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// addreview

interface IAddReview {
  reviews: number;
  ratings: string;
  userId: string;
}

export const addReview = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      userCourseList?.find((Id: any) => {
        Id?._Id.toString() === courseId.toString();
      });

      const course = await CourseModel.findById(courseId!);

      if (!course) return next(new ErrorHandler("Failed to get course", 400));

      const { reviews, ratings } = req.body as IAddReview;

      const addData = {
        user: req.user,
        ratings,
        comment: reviews,
      } as any;

      course.reviews.push(addData);

      let avg = 0;

      course.reviews.forEach((rev) => {
        avg += rev.ratings;
      });

      if (course.ratings && course.reviews.length > 0) {
        course.ratings = parseFloat(
          (avg / Math.floor(course.reviews.length)).toFixed(2)
        );
      }

      await course.save();

      const notification = {
        title: "New reviews received",
        message: `${req.user?.name} has giving a review in ${course.name} with ${course.ratings} rating score `,
      };

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// comment to review

interface IAddReviewComment {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addCommenToReview = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewComment;

      const course = await CourseModel.findById(courseId);

      if (!course) return next(new ErrorHandler("Invalide course ID", 400));

      const reviews = course.reviews?.find((review: any) => {
        return review._id.toString() === reviewId.toString();
      });

      if (!reviews || course.reviews.length === 0)
        return next(new ErrorHandler("Invalide review ID", 400));

      const addCommentToReviews = {
        user: req.user,
        comment,
      };

      if (!reviews.commentReplies) {
        reviews.commentReplies = [];
      }

      reviews?.commentReplies?.push(addCommentToReviews as any);
      await course.save();

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getAllCourses = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getAllUsersCourses(res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const deleteCourse = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if the authenticated user is an admin
    if (req.user?.role !== "admin") {
      return next(new ErrorHandler("Not authorized to delete Course", 403));
    }

    // Use the provided `id` from the request body for deletion
    const user = await CourseModel.findByIdAndDelete(id);

    if (!user) {
      return next(new ErrorHandler("No user with such ID", 404));
    }

    await redis.del(id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  }
);
