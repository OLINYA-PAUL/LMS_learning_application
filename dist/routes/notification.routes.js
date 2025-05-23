"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = require("../controllers/notification.controller");
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const notificationRoutes = express_1.default.Router();
notificationRoutes.get("/get-all-notifications", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authoriseUserRole)("admin"), notification_controller_1.getAllNotification);
notificationRoutes.put("/update-notifications/:id", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authoriseUserRole)("admin"), notification_controller_1.updateNotification);
exports.default = notificationRoutes;
