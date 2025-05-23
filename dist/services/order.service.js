"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersOrders = exports.createNewOrder = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const order_model_1 = require("../models/order.model");
exports.createNewOrder = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (data, res, next) => {
    try {
        const order = await order_model_1.OrderModel.create(data);
        if (!order) {
            return next(new errorHandler_1.default("Cannot create order", 400));
        }
        res.status(201).json({
            success: true,
            message: "Your order is successFul",
            order,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
const getAllUsersOrders = async (res, next) => {
    try {
        const users = await order_model_1.OrderModel.find({}).sort({ createdAt: -1 });
        if (!users)
            return "No Orders found";
        res.status(200).json({
            success: true,
            users,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
};
exports.getAllUsersOrders = getAllUsersOrders;
