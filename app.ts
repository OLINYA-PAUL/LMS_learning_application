// Environment Configuration
require("dotenv").config();

// Imports
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleWareHandler } from "./middleware/error";
import userRoute from "./routes/user.routes";
import courseRoute from "./routes/course.routes";
import orderRoute from "./routes/order.routes";
import notificationRoutes from "./routes/notification.routes";
import analysisRoute from "./routes/analysis.routes";
import layoutRoute from "./routes/layouts.routes";

// Initialize Express App
const app = express();

// Middlewares
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

let allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

// if (process.env.ALLOWED_CORS_ORIGINS) {
//   allowedOrigins = process.env.ALLOWED_CORS_ORIGINS;
// }

app.use(
  cors({
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
  })
);

// Routes
app.get("/test", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "User created successfully" });
});

app.use(
  "/api/v1",
  userRoute,
  courseRoute,
  orderRoute,
  notificationRoutes,
  analysisRoute,
  layoutRoute
);

// 404 Route Handler
app.get("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: false,
    errorMessage: `The route you searched (${req.originalUrl}) is not available. Please go back to the homepage.`,
  });
});

// Error Handling Middleware
app.use(errorMiddleWareHandler);

// Export App
export default app;
