import { NextFunction, Request, Response } from "express";
import { catchAsyncErroMiddleWare } from "./catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import JWT, { JwtPayload } from "jsonwebtoken";
import { UserModel } from "../models/user.models";
const createRedisClient = require("../utils/redis");

// authenticated user
export const isAuthenticated = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const redis = createRedisClient();
    const access_token = req.cookies.access_token;

    if (!access_token) {
      return next(
        new ErrorHandler("Please login to access this resource", 400)
      );
    }

    let decoded: JwtPayload;
    try {
      decoded = JWT.verify(
        access_token,
        process.env.ACCESS_TOKEN as string
      ) as JwtPayload;
    } catch (err) {
      return next(new ErrorHandler("Access token is invalid", 400));
    }

    // Check Redis for user data
    let user = await redis.get(decoded.id);

    if (!user) {
      // If user not found in Redis, check MongoDB
      const dbUser = await UserModel.findById(decoded.id);
      if (!dbUser) {
        return next(new ErrorHandler("Login to access this resource", 404));
      }

      // Cache user data in Redis for future requests
      await redis.set(decoded.id, JSON.stringify(dbUser), { EX: 3600 }); // Cache for 1 hour
      user = JSON.stringify(dbUser);
    }

    req.user = JSON.parse(user);
    next();
  }
);

// authorise user roles
export const authoriseUserRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user = { ...req.user, role: "admin" };
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role ${req.user?.role} is not allowed to access this resource`,
          400
        )
      );
    }

    // Call next() if the user's role is authorized
    next();
  };
};
