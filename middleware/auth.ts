import { NextFunction, Request, Response } from "express";
import { catchAsyncErroMiddleWare } from "./catchAsyncErrors";
import errorHandler from "../utils/errorHandler";
import JWT, { JwtPayload } from "jsonwebtoken";
const createRedisClient = require("../utils/redis");

// authenticated user
export const isAuthenticated = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const redis = createRedisClient();

    const access_token = req.cookies.access_token;
    console.log({ TOKEN: access_token });

    if (!access_token) {
      return next(
        new errorHandler("please login to access this resource", 400)
      );
    }

    let decoded;
    try {
      decoded = JWT.verify(
        access_token,
        process.env.ACCESS_TOKEN as string
      ) as JwtPayload;
    } catch (err) {
      return next(new errorHandler("access token is invalid", 400));
    }

    const user = await redis.get(decoded.id);
    if (!user) {
      return next(new errorHandler("user not found", 404));
    }

    req.user = JSON.parse(user);
    next();
  }
);
