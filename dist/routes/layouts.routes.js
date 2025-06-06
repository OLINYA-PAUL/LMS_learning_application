"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const layout_controller_1 = require("../controllers/layout.controller");
const user_controller_1 = require("../controllers/user.controller");
const layoutRoute = express_1.default.Router();
layoutRoute.post("/create-layout", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authoriseUserRole)("admin"), layout_controller_1.createLayout);
layoutRoute.put("/update-layout", user_controller_1.updateAccessToken, auth_1.isAuthenticated, (0, auth_1.authoriseUserRole)("admin"), layout_controller_1.editLayout);
layoutRoute.get("/get-layout/:type", layout_controller_1.getLayoutByType);
exports.default = layoutRoute;
