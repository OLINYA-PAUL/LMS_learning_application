require("dotenv").config();

import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import { Request, Response, NextFunction } from "express";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/errorHandler";
import { createCourse, getAllAdminCourses } from "../services/course.service";
import { CourseModel } from "../models/course.model";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import { sendEmail } from "../utils/sendMail";
import { notificationModel } from "../models/notification.model";
const createRedisClient = require("../utils/redis");
import axios from "axios";

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
        message: "Course updated",
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

export const getAllCourses = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModel.find({}).select(
        "-courseData.description -courseData.videoUrl -courseData.link -courseData.suggestions -courseData.questions"
      );

      if (!courses) {
        return next(new ErrorHandler("No course to show", 400));
      }

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// only for user who purchase course only

export const getCourseByUser = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const getUserCourse = req.user?.courses;
      const courseId = req.params.id;

      const findUserCourse = getUserCourse?.find((course) => {
        return course._id?.toString() === courseId.toString();
      });

      if (!findUserCourse) {
        return next(
          new ErrorHandler("You are not authorized to view this content", 400)
        );
      }

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      const courseId = req?.params.id;

      userCourseList?.find((Id: any) => {
        Id?._id.toString() === courseId.toString();
      });

      const course = await CourseModel.findById(courseId);

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

      const courseRate = course?.ratings! > 1 ? "scores" : "score";

      await notificationModel.create({
        userId: req.user?._id,
        title: "New reviews received",
        message: `${req.user?.name} has giving a review in ${course.name} with ${course.ratings} rating ${courseRate}`,
      });

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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

export const getAdminAllCourse = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getAllAdminCourses(res, next);
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

export const deleteUserReview = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id as string;
    const courseId = req.user?.courses;

    // Find the user's course

    //@ts-ignore

    const userCourse = courseId?.find(
      (course: any) => course?._id.toString() === userId
    );

    if (!userCourse) {
      return next(new ErrorHandler("Can't find course ID", 404));
    }

    const { reviewId } = req.body;

    if (!reviewId) {
      return next(new ErrorHandler("Review ID is required", 400));
    }

    // Find the course with the specific review
    const course = await CourseModel.findOne({ "reviews._id": reviewId });

    if (!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    // Check if the review exists within the course
    const reviewExists = course.reviews.find((review: any) => {
      //@ts-ignore
      return review?._id.toString() === reviewId;
    });

    if (!reviewExists) {
      return next(new ErrorHandler("Review not found", 404));
    }

    // Remove the review from the course
    await CourseModel.updateOne(
      { _id: course._id },
      { $pull: { reviews: { _id: reviewId } } }
    );

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  }
);

// export const generateVideoUrl = catchAsyncErroMiddleWare(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { videoID } = req.body;
//       if (!videoID) return next(new ErrorHandler("Video ID is required", 400));

//       // Ensure API Secret exists

//       const apiSecret = "yJ4t1FKEVaeFZR7kv45Q52Ci498YNetpTjDREGig4d4yvnOAUXZZYgiXCt5I4Bup";
//       if (!apiSecret) {
//         throw new Error(
//           "VIDCIPHER_API_SECRET is not set in the environment variables"
//         );
//       }

//       const response = await axios.post(
//         `https://dev.vdocipher.com/api/videos/${videoID}/otp`,
//         { ttl: 300 },
//         {
//           headers: {
//             Accept: "application/json",
//             "Content-Type": "application/json",
//             Authorization: `Apisecret ${apiSecret}`,
//           },
//         }
//       );

//       if (response.status !== 200) {
//         throw new Error(`Failed to generate OTP: ${response.statusText}`);
//       }

//       const { otp, playbackInfo } = response.data;

//       if (!otp || !playbackInfo) {
//         throw new Error(
//           "OTP or Playback information is missing in the response"
//         );
//       }

//       res.status(200).json({
//         success: true,
//         otp,
//         playbackInfo,
//       });
//     } catch (error: any) {
//       console.error(
//         "Error generating VideoCipher OTP:",
//         error.response?.data || error.message
//       );
//       return next(
//         new ErrorHandler(error.response?.data?.message || error.message, 400)
//       );
//     }
//   }
// );

export const generateVideoUrl = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoID } = req.body;
      if (!videoID) return next(new ErrorHandler("Video ID is required", 400));

      // Construct the embed URL
      const embedUrl = `https://www.youtube.com/embed/${videoID}`;

      console.log("videoUrl", embedUrl);

      res.status(200).json({
        success: true,
        embedUrl,
      });
    } catch (error: any) {
      console.error(error.message);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
