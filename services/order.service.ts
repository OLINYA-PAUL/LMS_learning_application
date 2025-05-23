import { NextFunction, Response } from "express";
import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import errorHandler from "../utils/errorHandler";
import { OrderModel } from "../models/order.model";

export const createNewOrder = catchAsyncErroMiddleWare(
  async (data: any, res: Response, next: NextFunction) => {
    try {
      const order = await OrderModel.create(data);
      if (!order) {
        return next(new errorHandler("Cannot create order", 400));
      }
      res.status(201).json({
        success: true,
        message: "Your order is successFul",
        order,
      });
    } catch (error: any) {
      return next(new errorHandler(error.message, 400));
    }
  }
);

export const getAllUsersOrders = async (res: Response, next: NextFunction) => {
  try {
    const users = await OrderModel.find({}).sort({ createdAt: -1 });
    if (!users) return "No Orders found";

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error: any) {
    return next(new errorHandler(error.message, 400));
  }
};
