import { Request, Response, NextFunction } from "express";
import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import errorHandler from "../utils/errorHandler";
import { notificationModel } from "../models/notification.model";
import cron from "node-cron";

// get all notification only for admin

export const getAllNotification = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await notificationModel
        .find({})
        .sort({ createdAt: -1 });

      if (!notifications || notifications.length === 0) {
        return next(new errorHandler("No notifications found", 404));
      }

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new errorHandler(error.message, 500)); // Internal server error
    }
  }
);

//update status notification for dmin only

export const updateNotification = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await notificationModel.findById(
        req.params?.id as string
      );

      if (!notification) {
        return next(new errorHandler("No notifications found", 404));
      }

      notification.status
        ? (notification.status = "read")
        : notification?.status;

      await notification.save();

      const notifications = await notificationModel
        .find({})
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new errorHandler(error.message, 500)); // Internal server error
    }
  }
);

// delete notification only for admin
cron.schedule("0 0 0 * * *", async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await notificationModel.deleteMany({
      status: "read",
      createdAt: { $lt: thirtyDaysAgo }, // Use $lt for older than 30 days
    });

    console.log(
      `[${new Date().toISOString()}] Deleted ${
        result.deletedCount
      } read notifications`
    );
  } catch (error: any) {
    console.error(
      `[${new Date().toISOString()}] Error deleting notifications: ${
        error.message
      }`
    );
  }
});
