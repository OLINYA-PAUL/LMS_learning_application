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

export const sendToken = (user: Iuser, statusCode: number, res: Response) => {
  const redis = createRedisClient();
  try {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // Optionally upload session to Redis DB

    redis.set(user._id, JSON.stringify(user), (err: string, data: any) => {
      try {
        if (data) return data;
        if (err) console.error("Error setting Redis data:", err);
      } catch (error) {
        console.log("Caught error:", error);
      }
    });

    // Expiration times (in milliseconds)
    const accessTokenExpire =
      parseInt(process.env.ACCESS_TOKEN_EXPIRE || "300", 10) * 1000; // Corrected multiplier for ms
    const refreshTokenExpire =
      parseInt(process.env.REFRESH_TOKEN_EXPIRE || "1200", 10) * 1000; // Corrected multiplier for ms

    // Options for cookies
    const accessTokenOptions: ItokenCookieOptions = {
      expires: new Date(Date.now() + accessTokenExpire),
      httpOnly: true,
      maxAge: accessTokenExpire,
      sameSite: "lax", // Consider changing to "strict" if CSRF protection is critical
    };

    const refreshTokenOptions: ItokenCookieOptions = {
      expires: new Date(Date.now() + refreshTokenExpire),
      httpOnly: true,
      maxAge: refreshTokenExpire,
      sameSite: "lax",
    };

    // Set secure cookies in production
    if (process.env.NODE_ENV === "production") {
      accessTokenOptions.secure = true;
      refreshTokenOptions.secure = true;
    }

    // Set cookies in response
    res.cookie("access-token", accessToken, accessTokenOptions);
    res.cookie("refresh-token", refreshToken, refreshTokenOptions);

    res.status(statusCode).json({
      success: true,
      message: "Token sent successfully 😂",
      user,
      accessToken,
    });
  } catch (error) {
    console.error("Error sending token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set authentication tokens",
    });
  }
};
