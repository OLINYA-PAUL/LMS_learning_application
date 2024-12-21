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

// Expiration times (in milliseconds)
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// Options for cookies
export const accessTokenOptions: ItokenCookieOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  httpOnly: true,
  sameSite: "lax",
  maxAge: accessTokenExpire * 60 * 60 * 1000,
};

// export const accessTokenOptions: ItokenCookieOptions = {
//   expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes to ms
//   httpOnly: true,
//   maxAge: 5 * 60 * 1000, // 5 minutes to ms
//   sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
// };

export const refreshTokenOptions: ItokenCookieOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  httpOnly: true,
  sameSite: "lax",
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
};

export const sendToken = (user: Iuser, statusCode: number, res: Response) => {
  const redis = createRedisClient();
  try {
    const { password, ...arg } = user;
    const access_token = user.SignAccessToken();
    const refresh_token = user.SignRefreshToken();

    // Optionally upload session to Redis DB

    redis.set(user._id, JSON.stringify(user), (err: string, data: any) => {
      try {
        if (data) return data;
        if (err) console.error("Error setting Redis data:", err);
      } catch (error) {
        console.log("Caught error:", error);
      }
    });

    // Set secure cookies in production
    if (process.env.NODE_ENV === "production") {
      accessTokenOptions.secure = true;
      refreshTokenOptions.secure = true;
    }

    // Set cookies in response
    res.cookie("access_token", access_token, accessTokenOptions);
    res.cookie("refresh_token", refresh_token, refreshTokenOptions);

    res.status(statusCode).json({
      success: true,
      message: "You have login successfully 😂",
      arg,
      access_token,
    });
  } catch (error) {
    console.error("Error sending token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set authentication tokens",
    });
  }
};
