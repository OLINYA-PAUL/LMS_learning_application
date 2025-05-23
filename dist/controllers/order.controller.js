"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newPayment = exports.stripePublishableKey = exports.deleteOrders = exports.getAllOrders = exports.createOrder = void 0;
require("dotenv").config();
const createRedisClient = require("../utils/redis");
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const user_models_1 = require("../models/user.models");
const sendMail_1 = require("../utils/sendMail");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const order_model_1 = require("../models/order.model");
const course_model_1 = require("../models/course.model");
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const order_service_1 = require("../services/order.service");
const notification_model_1 = require("../models/notification.model");
const mongoose_1 = __importDefault(require("mongoose"));
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const redis = createRedisClient();
// Helper to check if user already purchased the course
const checkUserCourseOwnership = (userCourses, courseId) => {
    return userCourses.some((course) => course._id?.toString() === courseId.toString());
};
// Service to send the confirmation email
const sendOrderConfirmationEmail = async (user, course) => {
    const mailData = {
        order: {
            // user_name: user?.name,
            // user_avatar: user?.avatar,
            _id: course._id,
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
    await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/orders-comfirmation-mail.ejs"), { order: mailData });
    // Send email
    await (0, sendMail_1.sendEmail)({
        email: user.email,
        subject: "Order Confirmation",
        template: "orders-comfirmation-mail.ejs",
        data: mailData,
    });
};
// Service to create a notification
const createPurchaseNotification = async (userId, courseName) => {
    await notification_model_1.notificationModel.create({
        userId,
        title: "New Course Purchased!",
        message: `You just purchased the course: ${courseName}`,
    });
};
// Main function to handle course order creation
exports.createOrder = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    const { courseId, payment_info } = req.body;
    if (payment_info) {
        if ("id" in payment_info) {
            const paymentIntentId = payment_info.id;
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== "succeeded") {
                return next(new errorHandler_1.default("Payment not authorized!", 400));
            }
        }
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(courseId)) {
        new errorHandler_1.default("courseid is not a valide id", 400);
    }
    // Validate user
    const user = await user_models_1.UserModel.findById(req.user?._id);
    if (!user)
        return next(new errorHandler_1.default("Invalid user ID provided", 400));
    // Check if user already owns the course
    if (checkUserCourseOwnership(user.courses, courseId)) {
        return next(new errorHandler_1.default("You have already purchased this course", 400));
    }
    // Validate course
    const course = await course_model_1.CourseModel.findById(courseId);
    if (!course)
        return next(new errorHandler_1.default("No course with this ID found", 400));
    // Prepare data for order creation
    const orderData = {
        courseId: course._id,
        userId: user._id,
        payment_info,
    };
    // Send order confirmation email
    await sendOrderConfirmationEmail(user, course);
    // Send notification to the user about course purchase
    const userId = req.user?._id;
    await createPurchaseNotification(userId, course.name);
    // Add course to user's purchased courses and save
    //@ts-ignore
    user.courses.push(course._id);
    await redis.set(req.user?._id, JSON.stringify(user));
    await user.save();
    course.purchased = course.purchased += 1;
    await course.save();
    // Create a new order record
    await (0, order_service_1.createNewOrder)(orderData, res, next);
});
exports.getAllOrders = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        await (0, order_service_1.getAllUsersOrders)(res, next);
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.deleteOrders = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    const { id } = req.params;
    // Check if the authenticated user is an admin
    if (req.user?.role !== "admin") {
        return next(new errorHandler_1.default("Not authorized to delete Order", 403));
    }
    // Use the provided `id` from the request body for deletion
    const user = await order_model_1.OrderModel.findByIdAndDelete(id);
    if (!user) {
        return next(new errorHandler_1.default("No user with such ID", 404));
    }
    await redis.del(id);
    res.status(200).json({
        success: true,
        message: "Orders deleted successfully",
    });
});
exports.stripePublishableKey = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    if (process.env.STRIPE_PUBLISHABLE_KEY) {
        res.status(200).json({
            stripPublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        });
    }
});
exports.newPayment = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: "usd",
            metadata: {
                company: "Paul LMS",
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });
        res.status(201).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
