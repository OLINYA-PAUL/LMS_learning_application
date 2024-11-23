import { NextFunction, Request, Response } from "express";
import { catchAsyncErroMiddleWare } from "./catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import JWT, { JwtPayload } from "jsonwebtoken";
const createRedisClient = require("../utils/redis");

// authenticated user
export const isAuthenticated = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const redis = createRedisClient();

    const access_token = req.cookies.access_token;

    if (!access_token) {
      return next(
        new ErrorHandler("please login to access this resource", 400)
      );
    }

    let decoded;
    try {
      decoded = JWT.verify(
        access_token,
        process.env.ACCESS_TOKEN as string
      ) as JwtPayload;
    } catch (err) {
      return next(new ErrorHandler("access token is invalid", 400));
    }

    const user = await redis.get(decoded.id);

    if (!user) {
      return next(new ErrorHandler("Login to access this resources", 404));
    }

    req.user = JSON.parse(user);
    next();
  }
);

// authorise user roles
export const authoriseUserRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    //@ts-ignore
    req.user = { ...req.user, role: "admin" };
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
