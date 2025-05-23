"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteUserReview = exports.deleteCourse = exports.getAdminAllCourse = exports.addCommenToReview = exports.addReview = exports.addAnswer = exports.addQuestions = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.updateCourse = exports.uploadCourse = void 0;
require("dotenv").config();
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const cloudinary_1 = __importDefault(require("cloudinary"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const course_service_1 = require("../services/course.service");
const course_model_1 = require("../models/course.model");
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const sendMail_1 = require("../utils/sendMail");
const notification_model_1 = require("../models/notification.model");
const createRedisClient = require("../utils/redis");
const redis = createRedisClient();
exports.uploadCourse = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnails;
        if (thumbnail && typeof thumbnail === "string") {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnails = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        await (0, course_service_1.createCourse)(data, res, next);
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.updateCourse = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const data = req.body;
        const thumbnailID = data.thumbnails;
        if (thumbnailID) {
            // Handle previous thumbnail deletion if `public_Id` exists
            await cloudinary_1.default.v2.uploader.destroy(thumbnailID);
            // Upload new thumbnail if `thumbnail` is a URL or file path
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnailID, {
                folder: "course",
            });
            // Update `data.thumbnail` with new Cloudinary details
            data.thumbnails = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        // Update the course with the modified data
        const course = await course_model_1.CourseModel.findByIdAndUpdate(courseId, { $set: data }, { new: true, upsert: true });
        if (!course) {
            return next(new errorHandler_1.default("Failed to update course", 400));
        }
        res.status(200).json({
            success: true,
            message: "Course updated",
            course,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
//get single course without purchase
exports.getSingleCourse = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const isCahedExsit = await redis.get(courseId);
        if (isCahedExsit) {
            const courses = JSON.parse(isCahedExsit);
            res.status(200).json({
                success: true,
                courses,
            });
        }
        else {
            const course = await course_model_1.CourseModel.findById(courseId).select("-courseData.description -courseData.videoUrl -courseData.link -courseData.suggestions -courseData.questions");
            if (!course) {
                return next(new errorHandler_1.default("No course to show", 400));
            }
            await redis.set(courseId, JSON.stringify(course), "EX", 604800);
            res.status(200).json({
                success: true,
                course,
            });
        }
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
//get all course without purchase
exports.getAllCourses = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const courses = await course_model_1.CourseModel.find({}).select("-courseData.description -courseData.videoUrl -courseData.link -courseData.suggestions -courseData.questions");
        if (!courses) {
            return next(new errorHandler_1.default("No course to show", 400));
        }
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
// only for user who purchase course only
exports.getCourseByUser = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const getUserCourse = req.user?.courses;
        const courseId = req.params.id;
        const findUserCourse = getUserCourse?.find((course) => {
            return course._id?.toString() === courseId.toString();
        });
        if (!findUserCourse) {
            return next(new errorHandler_1.default("You are not authorized to view this content", 400));
        }
        const courseContent = await course_model_1.CourseModel.findById(courseId);
        if (!courseContent) {
            return next(new errorHandler_1.default("No course found", 400));
        }
        res.status(200).json({
            success: true,
            courseContent,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.addQuestions = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        const course = await course_model_1.CourseModel.findById(courseId);
        if (!course) {
            return next(new errorHandler_1.default("Invalid course", 400));
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new errorHandler_1.default("Invalid content ID", 400));
        }
        const courseContent = course?.courseData.find((course) => course._id.equals(contentId));
        const addnewQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        courseContent?.question.push(addnewQuestion);
        await notification_model_1.notificationModel.create({
            userId: req.user?._id,
            title: "New Question Received",
            message: `You have a new question from: ${courseContent?.title}`,
        });
        await course.save();
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.addAnswer = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { answer, questionId, courseId, contentId } = req.body;
        const course = await course_model_1.CourseModel.findById(courseId);
        if (!course) {
            return next(new errorHandler_1.default("Invalid course", 400));
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new errorHandler_1.default("Invalid content ID", 400));
        }
        const courseContent = course?.courseData.find((course) => course._id.equals(contentId));
        if (!courseContent)
            return next(new errorHandler_1.default("Invalid content ID", 400));
        const question = courseContent.question.find((questionsId) => questionsId._id.equals(questionId));
        if (!question)
            return next(new errorHandler_1.default("Invalid question ID", 400));
        const addnewAnswer = {
            user: req.user,
            answer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        question.questionReplies?.push(addnewAnswer) ?? [];
        await course.save();
        if (req.user?._id === question.user._id) {
            await notification_model_1.notificationModel.create({
                userId: req.user?._id,
                title: "New Question Reply",
                message: `You have a new question from: ${courseContent?.title}`,
            });
        }
        else {
            const data = {
                name: req.user?.name,
                title: courseContent.title,
            };
            // render the data to EJS TEMPLATE
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                (0, sendMail_1.sendEmail)({
                    email: req.user?.email ?? "",
                    subject: "Question Replies",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (error) {
                return next(new errorHandler_1.default(error.message, 400));
            }
        }
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.addReview = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req?.params.id;
        userCourseList?.find((Id) => {
            Id?._id.toString() === courseId.toString();
        });
        const course = await course_model_1.CourseModel.findById(courseId);
        if (!course)
            return next(new errorHandler_1.default("Failed to get course", 400));
        const { reviews, ratings } = req.body;
        const addData = {
            user: req.user,
            ratings,
            comment: reviews,
        };
        course.reviews.push(addData);
        let avg = 0;
        course.reviews.forEach((rev) => {
            avg += rev.ratings;
        });
        if (course.ratings && course.reviews.length > 0) {
            course.ratings = parseFloat((avg / Math.floor(course.reviews.length)).toFixed(2));
        }
        await course.save();
        const courseRate = course?.ratings > 1 ? "scores" : "score";
        await notification_model_1.notificationModel.create({
            userId: req.user?._id,
            title: "New reviews received",
            message: `${req.user?.name} has giving a review in ${course.name} with ${course.ratings} rating ${courseRate}`,
        });
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.addCommenToReview = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { comment, courseId, reviewId } = req.body;
        const course = await course_model_1.CourseModel.findById(courseId);
        if (!course)
            return next(new errorHandler_1.default("Invalide course ID", 400));
        const reviews = course.reviews?.find((review) => {
            return review._id.toString() === reviewId.toString();
        });
        if (!reviews || course.reviews.length === 0)
            return next(new errorHandler_1.default("Invalide review ID", 400));
        const addCommentToReviews = {
            user: req.user,
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (!reviews.commentReplies) {
            reviews.commentReplies = [];
        }
        reviews?.commentReplies?.push(addCommentToReviews);
        await course.save();
        res.status(200).json({ success: true, course });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.getAdminAllCourse = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        await (0, course_service_1.getAllAdminCourses)(res, next);
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.deleteCourse = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    const { id } = req.params;
    // Check if the authenticated user is an admin
    if (req.user?.role !== "admin") {
        return next(new errorHandler_1.default("Not authorized to delete Course", 403));
    }
    // Use the provided `id` from the request body for deletion
    const user = await course_model_1.CourseModel.findByIdAndDelete(id);
    if (!user) {
        return next(new errorHandler_1.default("No user with such ID", 404));
    }
    await redis.del(id);
    res.status(200).json({
        success: true,
        message: "Course deleted successfully",
    });
});
exports.deleteUserReview = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    const userId = req.params.id;
    const courseId = req.user?.courses;
    // Find the user's course
    //@ts-ignore
    const userCourse = courseId?.find((course) => course?._id.toString() === userId);
    if (!userCourse) {
        return next(new errorHandler_1.default("Can't find course ID", 404));
    }
    const { reviewId } = req.body;
    if (!reviewId) {
        return next(new errorHandler_1.default("Review ID is required", 400));
    }
    // Find the course with the specific review
    const course = await course_model_1.CourseModel.findOne({ "reviews._id": reviewId });
    if (!course) {
        return next(new errorHandler_1.default("Course not found", 404));
    }
    // Check if the review exists within the course
    const reviewExists = course.reviews.find((review) => {
        //@ts-ignore
        return review?._id.toString() === reviewId;
    });
    if (!reviewExists) {
        return next(new errorHandler_1.default("Review not found", 404));
    }
    // Remove the review from the course
    await course_model_1.CourseModel.updateOne({ _id: course._id }, { $pull: { reviews: { _id: reviewId } } });
    res.status(200).json({
        success: true,
        message: "Review deleted successfully",
    });
});
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
exports.generateVideoUrl = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { videoID } = req.body;
        if (!videoID)
            return next(new errorHandler_1.default("Video ID is required", 400));
        // Construct the embed URL
        const embedUrl = `https://www.youtube.com/embed/${videoID}`;
        console.log("videoUrl", embedUrl);
        res.status(200).json({
            success: true,
            embedUrl,
        });
    }
    catch (error) {
        console.error(error.message);
        return next(new errorHandler_1.default(error.message, 500));
    }
});
