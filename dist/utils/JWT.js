"use strict";
// require("dotenv").config();
// import { Iuser } from "../models/user.models";
// const createRedisClient = require("./redis");
// import { Response } from "express";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = void 0;
// interface ItokenCookieOptions {
//   expires: Date;
//   httpOnly: boolean;
//   maxAge: number;
//   sameSite: "lax" | "strict" | "none" | undefined;
//   secure?: boolean;
// }
// // Expiration times (in milliseconds)
// const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "1", 10); // 1 hour
// const refreshTokenExpire = parseInt(
//   process.env.REFRESH_TOKEN_EXPIRE || "3",
//   10
// ); // 3 days
// export const accessTokenOptions: ItokenCookieOptions = {
//   expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000), // 1h
//   httpOnly: true,
//   sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
//   maxAge: accessTokenExpire * 60 * 60 * 1000, // 1h
// };
// export const refreshTokenOptions: ItokenCookieOptions = {
//   expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000), // 3d
//   httpOnly: true,
//   sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
//   maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000, // 3d
// };
// export const sendToken = async (
//   user: Iuser,
//   statusCode: number,
//   res: Response
// ) => {
//   const redis = createRedisClient();
//   try {
//     // const { password, ...arg } = user.toObject();
//     const access_token = user.SignAccessToken();
//     const refresh_token = user.SignRefreshToken();
//     // Optionally upload session to Redis DB
//     redis.set(user._id, JSON.stringify(user), (err: string, data: any) => {
//       try {
//         if (data) return data;
//         if (err) console.log("Error setting Redis data:", err);
//       } catch (error) {
//         console.log("Caught error:", error);
//       }
//     });
//     // Set secure cookies in production
//     if (process.env.NODE_ENV === "development") {
//       accessTokenOptions.secure = true;
//       refreshTokenOptions.secure = true;
//     }
//     // Set cookies in response
//     res.cookie("access_token", access_token, accessTokenOptions);
//     res.cookie("refresh_token", refresh_token, refreshTokenOptions);
//     res.status(statusCode).json({
//       success: true,
//       message: "account successfull",
//       user,
//       access_token,
//     });
//   } catch (error) {
//     console.error("Error sending token:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to authenticate user",
//     });
//   }
// };
require("dotenv").config();
const createRedisClient = require("./redis");
// Expiration times (in hours or days)
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "1", 10); // hours
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "3", 10); // days
// Export cookie options so other files can import these
exports.accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000), // 1 hour
    httpOnly: true,
    sameSite: "none",
    maxAge: accessTokenExpire * 60 * 60 * 1000,
    secure: true,
};
// sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
// secure: process.env.NODE_ENV === "production" ? true : false,
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000), // 3 days
    httpOnly: true,
    sameSite: "none",
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    secure: true,
};
// sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
// secure: process.env.NODE_ENV === "production" ? true : false,
const sendToken = async (user, statusCode, res) => {
    const redis = createRedisClient();
    try {
        const access_token = user.SignAccessToken();
        const refresh_token = user.SignRefreshToken();
        // Store user session in Redis
        redis.set(user._id, JSON.stringify(user), (err, data) => {
            if (err) {
                console.error("Error setting Redis data:", err);
            }
        });
        // Set cookies in response using exported options
        // Set cookies in response using exported options
        res.cookie("access_token", access_token, exports.accessTokenOptions);
        res.cookie("refresh_token", refresh_token, exports.refreshTokenOptions);
        res.status(statusCode).json({
            success: true,
            message: "account successful",
            user,
            access_token,
        });
    }
    catch (error) {
        console.error("Error sending token:", error);
        res.status(500).json({
            success: false,
            message: "Failed to authenticate user",
        });
    }
};
exports.sendToken = sendToken;
