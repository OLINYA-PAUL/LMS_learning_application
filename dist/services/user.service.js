"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUsersRollesService = exports.getAllUsersServices = exports.getUserByID = void 0;
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const user_models_1 = require("../models/user.models");
const createRedisClient = require("../utils/redis");
const getUserByID = async (id, res, next) => {
    const redis = createRedisClient();
    try {
        // If not found in Redis, fetch from the database
        const userFromDb = await user_models_1.UserModel.findById(id);
        if (!userFromDb) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        // Check Redis for the user
        const redisUser = await redis.get(id);
        if (redisUser) {
            const user = JSON.parse(redisUser);
            return res.status(200).json({ success: true, user });
        }
        // Store in Redis for future requests (1 hour TTL)
        await redis.set(id, JSON.stringify(userFromDb), "EX", 3600);
        return res.status(200).json({ success: true, user: userFromDb });
    }
    catch (error) {
        next(new errorHandler_1.default(`Failed to fetch user: ${error.message}`, 500));
    }
};
exports.getUserByID = getUserByID;
const getAllUsersServices = async (res, next) => {
    try {
        const users = await user_models_1.UserModel.find({}).sort({ createdAt: -1 });
        if (!users)
            return "No users found";
        res.status(200).json({
            success: true,
            users,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
};
exports.getAllUsersServices = getAllUsersServices;
const updateUsersRollesService = async (res, id, role, next) => {
    try {
        // Using findByIdAndUpdate to update the user's role directly
        const user = await user_models_1.UserModel.findByIdAndUpdate(id, { role }, // Update the role field
        { new: true, runValidators: true } // Return the updated document and run validators
        );
        // if (id !== user?._id) {
        //   return next(new errorHandler("No user with  that id", 404));
        // }
        if (!user) {
            return next(new errorHandler_1.default("No user found with this ID", 404));
        }
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        next(new errorHandler_1.default(error.message, 500));
    }
};
exports.updateUsersRollesService = updateUsersRollesService;
