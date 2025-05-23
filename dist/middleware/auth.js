"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authoriseUserRole = exports.isAuthenticated = void 0;
const catchAsyncErrors_1 = require("./catchAsyncErrors");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_models_1 = require("../models/user.models");
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
exports.isAuthenticated = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    // Create Redis client
    const redis = createRedisClient();
    // Get access token from cookies
    const access_token = req.cookies?.access_token;
    // Check if access token exists
    if (!access_token) {
        return next(new errorHandler_1.default("Please login to access this resource", 401));
    }
    // Verify JWT token
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(access_token, process.env.ACCESS_TOKEN);
    }
    catch (err) {
        // Handle different JWT verification errors
        if (err.name === "TokenExpiredError") {
            return next(new errorHandler_1.default("Access token has expired", 401));
        }
        return next(new errorHandler_1.default("Invalid access token", 401));
    }
    // Validate decoded token has required fields
    if (!decoded || !decoded.id) {
        return next(new errorHandler_1.default("Malformed access token", 401));
    }
    try {
        // Check Redis for user data
        let userJson = await redis.get(decoded.id);
        let user;
        if (!userJson) {
            // If user not found in Redis, check database
            const dbUser = await user_models_1.UserModel.findById(decoded.id);
            if (!dbUser) {
                return next(new errorHandler_1.default("User not found, please login again", 401));
            }
            // Cache user data in Redis for future requests
            userJson = JSON.stringify(dbUser);
            await redis.set(decoded.id, userJson, { EX: 3600 }); // Cache for 1 hour
        }
        try {
            // Parse user data from Redis
            user = JSON.parse(userJson);
        }
        catch (parseError) {
            // Handle corrupted user data
            return next(new errorHandler_1.default("Session data corrupted, please login again", 500));
        }
        // Validate user object has expected properties
        if (!user || !user._id) {
            return next(new errorHandler_1.default("Invalid user data, please login again", 401));
        }
        // Attach user to request
        req.user = user;
        next();
    }
    catch (redisError) {
        // Gracefully handle Redis errors by falling back to database
        try {
            const dbUser = await user_models_1.UserModel.findById(decoded.id);
            if (!dbUser) {
                return next(new errorHandler_1.default("User not found, please login again", 401));
            }
            req.user = dbUser;
            next();
        }
        catch (dbError) {
            return next(new errorHandler_1.default("Authentication service unavailable", 503));
        }
    }
});
// authorise user roles
const authoriseUserRole = (...roles) => {
    return (req, res, next) => {
        // req.user = { ...req.user, role: "admin" };
        if (!roles.includes(req.user?.role || "")) {
            return next(new errorHandler_1.default(`Role ${req.user?.role} is not allowed to access this resource`, 400));
        }
        // Call next() if the user's role is authorized
        next();
    };
};
exports.authoriseUserRole = authoriseUserRole;
