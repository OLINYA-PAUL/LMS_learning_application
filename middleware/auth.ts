import { NextFunction, Request, Response } from "express";
import { catchAsyncErroMiddleWare } from "./catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import JWT, { JwtPayload } from "jsonwebtoken";
import { UserModel } from "../models/user.models";
const createRedisClient = require("../utils/redis");

// authenticated user
// export const isAuthenticated = catchAsyncErroMiddleWare(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const redis = createRedisClient();
//     const access_token = req.cookies.access_token;

//     if (!access_token) {
//       return next(
//         new ErrorHandler("Please login to access this resource", 400)
//       );
//     }

//     let decoded: JwtPayload;
//     try {
//       decoded = JWT.verify(
//         access_token,
//         process.env.ACCESS_TOKEN as string
//       ) as JwtPayload;
//     } catch (err) {
//       return next(new ErrorHandler("Access token is invalid", 400));
//     }

//     // Check Redis for user data
//     let user = await redis.get(decoded.id);

//     if (!user) {
//       // If user not found in Redis, check MongoDB
//       const dbUser = await UserModel.findById(decoded.id);
//       if (!dbUser) {
//         return next(new ErrorHandler("Login to access this resource", 404));
//       }

//       // Cache user data in Redis for future requests
//       await redis.set(decoded.id, JSON.stringify(dbUser), { EX: 3600 }); // Cache for 1 hour
//       user = JSON.stringify(dbUser);
//     }

//     req.user = JSON.parse(user);
//     next();
//   }
// );

export const isAuthenticated = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    // Create Redis client
    const redis = createRedisClient();

    // Get access token from cookies
    const access_token = req.cookies?.access_token;

    // Check if access token exists
    if (!access_token) {
      return next(
        new ErrorHandler("Please login to access this resource", 401)
      );
    }

    // Verify JWT token
    let decoded: JwtPayload;
    try {
      decoded = JWT.verify(
        access_token,
        process.env.ACCESS_TOKEN as string
      ) as JwtPayload;
    } catch (err) {
      // Handle different JWT verification errors
      if ((err as Error).name === "TokenExpiredError") {
        return next(new ErrorHandler("Access token has expired", 401));
      }
      return next(new ErrorHandler("Invalid access token", 401));
    }

    // Validate decoded token has required fields
    if (!decoded || !decoded.id) {
      return next(new ErrorHandler("Malformed access token", 401));
    }

    try {
      // Check Redis for user data
      let userJson = await redis.get(decoded.id);
      let user;

      if (!userJson) {
        // If user not found in Redis, check database
        const dbUser = await UserModel.findById(decoded.id);

        if (!dbUser) {
          return next(
            new ErrorHandler("User not found, please login again", 401)
          );
        }

        // Cache user data in Redis for future requests
        userJson = JSON.stringify(dbUser);
        await redis.set(decoded.id, userJson, { EX: 3600 }); // Cache for 1 hour
      }

      try {
        // Parse user data from Redis
        user = JSON.parse(userJson);
      } catch (parseError) {
        // Handle corrupted user data
        return next(
          new ErrorHandler("Session data corrupted, please login again", 500)
        );
      }

      // Validate user object has expected properties
      if (!user || !user._id) {
        return next(
          new ErrorHandler("Invalid user data, please login again", 401)
        );
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (redisError) {
      // Gracefully handle Redis errors by falling back to database
      try {
        const dbUser = await UserModel.findById(decoded.id);

        if (!dbUser) {
          return next(
            new ErrorHandler("User not found, please login again", 401)
          );
        }

        req.user = dbUser;
        next();
      } catch (dbError) {
        return next(
          new ErrorHandler("Authentication service unavailable", 503)
        );
      }
    }
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
