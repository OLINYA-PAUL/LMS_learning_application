"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = void 0;
require("dotenv").config();
const createRedisClient = require("./redis");
// Expiration times (in milliseconds)
const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || "1", 10); // 1 hour
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || "3", 10); // 3 days
exports.accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000), // 1h
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
    maxAge: accessTokenExpire * 60 * 60 * 1000, // 1h
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000), // 3d
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "strict",
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000, // 3d
};
const sendToken = async (user, statusCode, res) => {
    const redis = createRedisClient();
    try {
        // const { password, ...arg } = user.toObject();
        const access_token = user.SignAccessToken();
        const refresh_token = user.SignRefreshToken();
        // Optionally upload session to Redis DB
        redis.set(user._id, JSON.stringify(user), (err, data) => {
            try {
                if (data)
                    return data;
                if (err)
                    console.log("Error setting Redis data:", err);
            }
            catch (error) {
                console.log("Caught error:", error);
            }
        });
        // Set secure cookies in production
        if (process.env.NODE_ENV === "development") {
            exports.accessTokenOptions.secure = true;
            exports.refreshTokenOptions.secure = true;
        }
        // Set cookies in response
        res.cookie("access_token", access_token, exports.accessTokenOptions);
        res.cookie("refresh_token", refresh_token, exports.refreshTokenOptions);
        res.status(statusCode).json({
            success: true,
            message: "account successfull",
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
