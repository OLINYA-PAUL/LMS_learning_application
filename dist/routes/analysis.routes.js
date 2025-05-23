"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const analysis_controller_1 = require("../controllers/analysis.controller");
const analysisRoute = express_1.default.Router();
analysisRoute.get("/get-user-analysis", auth_1.isAuthenticated, (0, auth_1.authoriseUserRole)("admin"), analysis_controller_1.getUsersAnalysis);
analysisRoute.get("/get-courses-analysis", auth_1.isAuthenticated, (0, auth_1.authoriseUserRole)("admin"), analysis_controller_1.getCoursesAnalysis);
analysisRoute.get("/get-orders-analysis", auth_1.isAuthenticated, (0, auth_1.authoriseUserRole)("admin"), analysis_controller_1.getOrdersAnalysis);
exports.default = analysisRoute;
