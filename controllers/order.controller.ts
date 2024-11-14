import { Response, Request, NextFunction } from "express";
import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import { UserModel } from "../models/user.models";
import { sendEmail } from "../utils/sendMail";
import ErrorHandler from "../utils/errorHandler";
import { IOrder } from "../models/order.model";
import { CourseModel } from "../models/course.model";
import path from "path";
import EJS from "ejs";
import { createNewOrder } from "../services/order.service";
import { notificationModel } from "../models/notification.model";
import mongoose from "mongoose";

// Helper to check if user already purchased the course
const checkUserCourseOwnership = (
  userCourses: any[],
  courseId: string
): boolean => {
  return userCourses.some(
    (course) => course._id?.toString() === courseId.toString()
  );
};

// Service to send the confirmation email
const sendOrderConfirmationEmail = async (user: any, course: any) => {
  const mailData = {
    order: {
      // user_name: user?.name,
      // user_avatar: user?.avatar,
      _id: course._id as string,
      name: course.name,
      price: course.price,
      description: course.description,
      estimatedPrice: course.estimatedPrice,
      date: new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      }),
    },
  };

  // Render email template with EJS
  await EJS.renderFile(
    path.join(__dirname, "../mails/orders-comfirmation-mail.ejs"),
    { order: mailData }
  );
  // Send email
  await sendEmail({
    email: user.email,
    subject: "Order Confirmation",
    template: "orders-comfirmation-mail.ejs",
    data: mailData,
  });
};

// Service to create a notification
const createPurchaseNotification = async (
  userId: string,
  courseName: string
) => {
  await notificationModel.create({
    userId,
    title: "New Course Purchased!",
    message: `You just purchased the course: ${courseName}`,
  });
};

// Main function to handle course order creation
export const createOrder = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId, payment_info } = req.body as IOrder;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      new ErrorHandler("courseid is not a valide id", 400);
    }

    // Validate user
    const user = await UserModel.findById(req.user?._id);
    if (!user) return next(new ErrorHandler("Invalid user ID provided", 400));

    // Check if user already owns the course
    if (checkUserCourseOwnership(user.courses, courseId)) {
      console.log({ PURCHASEDiD: courseId });
      return next(
        new ErrorHandler("You have already purchased this course", 400)
      );
    }

    // Validate course
    const course = await CourseModel.findById(courseId);
    if (!course)
      return next(new ErrorHandler("No course with this ID found", 400));

    // Prepare data for order creation
    const orderData = {
      courseId: course._id,
      userId: user._id,
      payment_info,
    } as any;

    // Send order confirmation email
    await sendOrderConfirmationEmail(user, course);

    // Send notification to the user about course purchase
    const userId = req.user?._id as string;
    await createPurchaseNotification(userId, course.name);

    // Add course to user's purchased courses and save
    //@ts-ignore
    user.courses.push(course._id);
    await user.save();

    course.purchased
      ? Number((course.purchased += 1))
      : Number(course.purchased);

    await course.save();

    // Create a new order record

    await createNewOrder(orderData, res, next);
  }
);
