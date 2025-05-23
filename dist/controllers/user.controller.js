"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUsers = exports.updateUsersRolles = exports.getAllUsers = exports.updateUserAvatar = exports.updateUserPassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logOutUser = exports.loginUser = exports.activateUser = exports.registerationUser = void 0;
require("dotenv").config();
const user_models_1 = require("../models/user.models");
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const errorHandler_1 = __importDefault(require("../utils/errorHandler")); // Use ErrorHandler instead
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const sendMail_1 = require("../utils/sendMail");
const JWT_1 = require("../utils/JWT");
const user_service_1 = require("../services/user.service");
const createRedisClient = require("../utils/redis");
const redis = createRedisClient();
exports.registerationUser = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    const { name, email, password, avatar } = req.body;
    if (!email) {
        return next(new errorHandler_1.default("Email is required", 400));
    }
    // Check if email already exists
    const isEmailExsit = await user_models_1.UserModel.findOne({ email });
    if (isEmailExsit) {
        return next(new errorHandler_1.default("Email already exists", 400)); // Correct usage of ErrorHandler
    }
    // Validate password length BEFORE hashing
    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            error: "Password must be between 6 and 10 characters long.",
        });
    }
    const user = {
        name,
        email,
        password,
    };
    const { token, activationCode } = createActivationToken(user);
    const data = { user: { ...user, name }, activationCode };
    // Render email template
    await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation-mail.ejs"), data);
    try {
        // Send email
        await (0, sendMail_1.sendEmail)({
            email,
            subject: "Please activate your account!!",
            template: "activation-mail.ejs",
            data,
        });
        res.status(201).json({
            success: true,
            message: "Please check your email to activate your account",
            activationToken: token,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 500)); // Catch and forward email sending error
    }
});
const createActivationToken = (user) => {
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = jsonwebtoken_1.default.sign({ user, activationCode }, // Payload
    process.env.ACTIVATION_SECRET, // Secret key
    { expiresIn: "5m" } // Options (expiration time)
    );
    return { token, activationCode };
};
exports.activateUser = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { activation_token, activation_code } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, process.env.ACTIVATION_SECRET // Secret key
        );
        if (newUser.activationCode !== activation_code) {
            return next(new errorHandler_1.default("invalide activation code entered", 500)); // Catch and forward email sending error
        }
        const { name, email, password } = newUser.user;
        const userExsite = await user_models_1.UserModel.findOne({ email });
        if (userExsite) {
            return next(new errorHandler_1.default("user with the email already exsit", 400)); // Catch and forward email sending error
        }
        const user = await user_models_1.UserModel.create({
            name,
            email,
            password,
            authType: "local",
        });
        await user.save();
        res.status(201).json({
            sucess: true,
            message: " account created ",
        });
        // sendToken(user, 200, res);
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 500)); // Catch and forward email sending error
    }
});
exports.loginUser = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new errorHandler_1.default("Email and password are required", 400));
        }
        const user = await user_models_1.UserModel.findOne({ email }).select("+password");
        if (!user) {
            return next(new errorHandler_1.default("Invalid user email or password", 400));
        }
        // This method will throw an error if the password doesn't match
        (await user.CompareUserPassword(password)) || "";
        (0, JWT_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 500));
    }
});
exports.logOutUser = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        // Set the cookies with maxAge to expire them immediately
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        await redis.del(req.user?._id || "");
        res.status(200).json({ success: true, message: "Logout successfully" });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
// update user access_token ID
exports.updateAccessToken = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    const refresh_token = req.cookies.refresh_token;
    // Check if refresh token exists
    if (!refresh_token) {
        return next(new errorHandler_1.default("Refresh token not provided", 401));
    }
    // Verify refresh token
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN);
    }
    catch (error) {
        return next(new errorHandler_1.default("Invalid or expired refresh token", 401));
    }
    if (!decoded.id) {
        return next(new errorHandler_1.default("Invalid token format", 401));
    }
    // Get user session from Redis
    let session = await redis.get(decoded.id);
    let user;
    // If no Redis session, try to get user from database
    if (!session) {
        const userFromDb = await user_models_1.UserModel.findById(decoded.id);
        if (!userFromDb) {
            return next(new errorHandler_1.default("User not found, please login again", 401));
        }
        // Create a new session for valid user found in database
        user = userFromDb;
        // Store user in Redis for future requests
        await redis.set(decoded.id, JSON.stringify(user), "EX", 604800); // 7 days
    }
    else {
        // Parse the session data
        try {
            user = JSON.parse(session);
        }
        catch (error) {
            return next(new errorHandler_1.default("Invalid session data, please login again", 500));
        }
        // Validate parsed user data
        if (!user || !user._id) {
            return next(new errorHandler_1.default("Corrupted session data, please login again", 500));
        }
    }
    // Generate new tokens
    const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN, { expiresIn: "1h" });
    const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN, { expiresIn: "3d" });
    // Attach user to request
    req.user = user;
    // Set cookies with new tokens
    res.cookie("access_token", accessToken, JWT_1.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, JWT_1.refreshTokenOptions);
    // Update Redis session (use user._id consistently)
    await redis.set(user._id, JSON.stringify(user), "EX", 604800); // 7 days
    if (req.path === "/refresh-token") {
        return res.json({
            message: "Access token refreshed successfully",
            accessToken,
        });
    }
    next();
});
/// get user byID
exports.getUserInfo = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const userId = req.user?._id;
        console.log({ userID: userId });
        if (!userId) {
            return res
                .status(400)
                .json({ success: false, message: "User ID is missing" });
        }
        await (0, user_service_1.getUserByID)(userId, res, next); // Pass res and next to handle response and error
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400)); // Catch and pass errors to the error handler
    }
});
exports.socialAuth = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { email, name, avatar } = req.body;
        if (!email || !name || !avatar) {
            return next(new errorHandler_1.default("This field is required", 400));
        }
        const user = await user_models_1.UserModel.findOne({ email });
        if (!user) {
            const newUser = await user_models_1.UserModel.create({
                email,
                name,
                avatar,
                authType: "social",
            });
            (0, JWT_1.sendToken)(newUser, 200, res);
            // newUser.save();
        }
        else {
            (0, JWT_1.sendToken)(user, 200, res);
        }
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.updateUserInfo = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { name } = req.body;
        const userId = req.user?._id;
        const user = await user_models_1.UserModel.findById(userId);
        if (name && user) {
            user.name = name;
        }
        await user?.save();
        await redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "user email and name updated successfully",
            user,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.updateUserPassword = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { oldpassword, newpassword } = req.body;
        if (!(oldpassword || newpassword)) {
            return next(new errorHandler_1.default("Please enter both old and new password", 400));
        }
        const user = await user_models_1.UserModel.findById(req.user?._id).select("+password");
        if (user?.authType === "social" || user?.password === undefined) {
            return next(new errorHandler_1.default("Invalide user", 400));
        }
        const isPasswordMatch = await user?.CompareUserPassword(oldpassword);
        if (!isPasswordMatch) {
            return next(new errorHandler_1.default("Incorrect password", 400));
        }
        user.password = newpassword;
        await user?.save();
        await redis.set(req.user?._id, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "Password updated successfully",
            user,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.updateUserAvatar = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { avatar } = req.body;
        if (!avatar)
            return next(new errorHandler_1.default("Image is required", 400));
        const userId = req.user?._id;
        const user = await user_models_1.UserModel.findById(userId);
        if (!user)
            return next(new errorHandler_1.default("No user found", 400));
        let myCloud;
        if (user?.avatar?.public_Id) {
            // Delete old avatar
            await cloudinary_1.default.v2.uploader.destroy(user.avatar.public_Id, {
                invalidate: true, // Ensures the old image is fully removed
            });
        }
        // Upload new avatar
        myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
            folder: "avatar",
            width: 150,
            image_metadata: true,
        });
        user.avatar = {
            public_Id: myCloud.public_id,
            url: myCloud.secure_url,
        };
        user.markModified("avatar"); // Ensure Mongoose detects the change
        await user.save();
        // Refresh Redis Cache (Optional)
        await redis.del(userId); // Delete old cache
        await redis.set(userId, JSON.stringify(user)); // Store updated user
        res.status(200).json({
            success: true,
            message: "Profile image updated successfully",
            user,
        });
    }
    catch (error) {
        console.error("Avatar Update Error:", error.message);
        return next(new errorHandler_1.default(error.message, 400));
    }
});
// get all users
exports.getAllUsers = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        await (0, user_service_1.getAllUsersServices)(res, next);
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.updateUsersRolles = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { id, role } = req.body;
        await (0, user_service_1.updateUsersRollesService)(res, id, role, next);
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
exports.deleteUsers = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    const { id } = req.params;
    // Check if the authenticated user is an admin
    if (req.user?.role !== "admin") {
        return next(new errorHandler_1.default("Not authorized to delete users", 403));
    }
    // Use the provided `id` from the  params for deletion
    const user = await user_models_1.UserModel.findByIdAndDelete(id);
    if (!user) {
        return next(new errorHandler_1.default("No user with such ID", 404));
    }
    await redis.del(id);
    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});
