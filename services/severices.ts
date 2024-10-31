import { NextFunction, Response } from "express";
import errorHandler from "../utils/errorHandler";
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
