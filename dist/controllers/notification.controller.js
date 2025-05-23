"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotification = exports.getAllNotification = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const notification_model_1 = require("../models/notification.model");
const node_cron_1 = __importDefault(require("node-cron"));
// get all notification only for admin
exports.getAllNotification = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const notifications = await notification_model_1.notificationModel
            .find({})
            .sort({ createdAt: -1 });
        if (!notifications || notifications.length === 0) {
            return next(new errorHandler_1.default("No notifications found", 404));
        }
        res.status(200).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 500)); // Internal server error
    }
});
//update status notification for dmin only
exports.updateNotification = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const notification = await notification_model_1.notificationModel.findById(req.params?.id);
        if (!notification) {
            return next(new errorHandler_1.default("No notifications found", 404));
        }
        notification.status
            ? (notification.status = "read")
            : notification?.status;
        await notification.save();
        const notifications = await notification_model_1.notificationModel
            .find({})
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 500)); // Internal server error
    }
});
// delete notification only for admin
node_cron_1.default.schedule("0 0 0 * * *", async () => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await notification_model_1.notificationModel.deleteMany({
            status: "read",
            createdAt: { $lt: thirtyDaysAgo }, // Use $lt for older than 30 days
        });
        console.log(`[${new Date().toISOString()}] Deleted ${result.deletedCount} read notifications`);
    }
    catch (error) {
        console.error(`[${new Date().toISOString()}] Error deleting notifications: ${error.message}`);
    }
});
