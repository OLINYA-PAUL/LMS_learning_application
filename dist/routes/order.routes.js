"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const order_controller_1 = require("../controllers/order.controller");
const user_controller_1 = require("../controllers/user.controller");
const analysis_controller_1 = require("../controllers/analysis.controller");
const orderRoute = express_1.default.Router();
orderRoute.post("/create-order", auth_1.isAuthenticated, order_controller_1.createOrder);
orderRoute.get("/get-all-orders", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authoriseUserRole)("admin"), order_controller_1.getAllOrders);
orderRoute.delete("/delete-orders/:id", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authoriseUserRole)("admin"), order_controller_1.deleteOrders);
orderRoute.get("/orders-analysis", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authoriseUserRole)("admin"), analysis_controller_1.getOrdersAnalysis);
orderRoute.get("/get-newpayment/stripePublishableKey", user_controller_1.updateAccessToken, 
// isAuthenticated,
order_controller_1.stripePublishableKey);
orderRoute.post("/post-newpayment", user_controller_1.updateAccessToken, auth_1.isAuthenticated, order_controller_1.newPayment);
exports.default = orderRoute;
