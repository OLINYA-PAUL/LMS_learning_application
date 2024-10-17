require("dotenv").config();
import { Iuser } from "../models/user.models";
import { redisDB } from "./redis";
import { Response } from "express";

interface ItokenCookieOptions {
  expires: Date;
  httpOnly: boolean;
  maxAge: number;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

export const sendToken = (user: Iuser, statusCode: number, res: Response) => {
  //@ts-ignore
  const { client } = redisDB();

  try {
    const accessToken = user.SignAccessToken(); // Corrected spelling
    const refreshToken = user.SignRefreshToken(); // Corrected spelling

    // Optionally upload session to Redis DB

    client.set(
      user._id,
      JSON.stringify(user) as any,
      (err: any, result: any) => {
        if (err) {
          console.error("Error setting value in Redis:", err);
        } else {
          console.log("Value set successfully in Redis:", result);
        }
      }
    );

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
