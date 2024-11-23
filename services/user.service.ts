import { NextFunction, Response } from "express";
import errorHandler from "../utils/errorHandler";
import { UserModel } from "../models/user.models";
const createRedisClient = require("../utils/redis");

export const getUserByID = async (
  id: string,
  res: Response,
  next: NextFunction
) => {
  const redis = createRedisClient();
  try {
    const redisUser = await redis.get(id);
    if (redisUser) {
      const user = JSON.parse(redisUser);
      res.status(200).json({ success: true, user });
    }
  } catch (error: any) {
    return next(new errorHandler(error.message, 400));
  }
};

export const getAllUsersServices = async (
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await UserModel.find({}).sort({ createdAt: -1 });
    if (!users) return "No users found";

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error: any) {
    return next(new errorHandler(error.message, 400));
  }
};

export const updateUsersRollesService = async (
  res: Response,
  id: string,
  role: string,
  next: NextFunction
) => {
  try {
    // Using findByIdAndUpdate to update the user's role directly
    const user = await UserModel.findByIdAndUpdate(
      id,
      { role }, // Update the role field
      { new: true, runValidators: true } // Return the updated document and run validators
    );

    if (!user) {
      return next(new errorHandler("No user found with this ID", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    next(new errorHandler(error.message, 500));
  }
};
