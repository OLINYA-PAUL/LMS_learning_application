"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Environment Configuration
require("dotenv").config();
// Imports
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_1 = require("./middleware/error");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const course_routes_1 = __importDefault(require("./routes/course.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const analysis_routes_1 = __importDefault(require("./routes/analysis.routes"));
const layouts_routes_1 = __importDefault(require("./routes/layouts.routes"));
// Initialize Express App
const app = (0, express_1.default)();
// Middlewares
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
let allowedOrigins = ["https://elearningapp-weld.vercel.app", "https://elearningapp-weld.vercel.app", "https://elearningapp-weld.vercel.app"];
// if (process.env.ALLOWED_CORS_ORIGINS) {
//   allowedOrigins = process.env.ALLOWED_CORS_ORIGINS;
// }
app.use((0, cors_1.default)({
    // origin: (origin, callback) => {
    //   if (!origin || allowedOrigins?.includes(origin)) {
    //     callback(null, true); // Allow if the origin is in the list or it's a non-CORS request
    //   } else {
    //     callback(new Error("Not allowed by CORS")); // Reject other origins
    //   }
    // },
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
    credentials: true,
    maxAge: 3600,
    optionsSuccessStatus: 204,
}));
// Routes
app.get("/test", (req, res) => {
    res.status(200).json({ success: true, message: "User created successfully" });
});
app.use("/api/v1", user_routes_1.default, course_routes_1.default, order_routes_1.default, notification_routes_1.default, analysis_routes_1.default, layouts_routes_1.default);
// 404 Route Handler
app.get("*", (req, res) => {
    res.status(404).json({
        error: false,
        errorMessage: `The route you searched (${req.originalUrl}) is not available. Please go back to the homepage.`,
    });
});
// Error Handling Middleware
app.use(error_1.errorMiddleWareHandler);
// Export App
exports.default = app;
