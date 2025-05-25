// require("dotenv").config();
// import { Iuser } from "../models/user.models";
// const createRedisClient = require("./redis");
// import { Response } from "express";

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
import { Iuser } from "../models/user.models";
const createRedisClient = require("./redis");
import { Response } from "express";

interface ItokenCookieOptions {
  expires: Date;
  httpOnly: boolean;
  maxAge: number;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// Expiration times (in hours or days)
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "1", 10); // hours
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "3",
  10
); // days

// Base cookie options (without secure)
const baseAccessTokenOptions: Omit<ItokenCookieOptions, "secure"> = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000), // 1 hour
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
  maxAge: accessTokenExpire * 60 * 60 * 1000,
};

const baseRefreshTokenOptions: Omit<ItokenCookieOptions, "secure"> = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000), // 3 days
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
};

export const sendToken = async (
  user: Iuser,
  statusCode: number,
  res: Response
) => {
  const redis = createRedisClient();
  try {
    const access_token = user.SignAccessToken();
    const refresh_token = user.SignRefreshToken();

    // Store user session in Redis
    redis.set(user._id, JSON.stringify(user), (err: string, data: any) => {
      if (err) {
        console.error("Error setting Redis data:", err);
      }
    });

    // Add secure flag only in production
    const accessTokenOptions: ItokenCookieOptions = {
      ...baseAccessTokenOptions,
      secure: process.env.NODE_ENV === "production",
    };

    const refreshTokenOptions: ItokenCookieOptions = {
      ...baseRefreshTokenOptions,
      secure: process.env.NODE_ENV === "production",
    };

    // Set cookies in response
    res.cookie("access_token", access_token, accessTokenOptions);
    res.cookie("refresh_token", refresh_token, refreshTokenOptions);

    res.status(statusCode).json({
      success: true,
      message: "account successful",
      user,
      access_token,
    });
  } catch (error) {
    console.error("Error sending token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to authenticate user",
    });
  }
};
