// Environment Configuration
require("dotenv").config();

// Imports
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleWareHandler } from "./middleware/error";
import userRoute from "./routes/user.routes";
import courseRoute from "./routes/course.routes";

// Initialize Express App
const app = express();

// Middlewares
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(
  cors({
    origin: process.env.ORIGIN || "http://localhost:3000", // Fallback to localhost
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
    maxAge: 3600,
    optionsSuccessStatus: 204,
  })
);

// Routes
app.get("/test", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "User created successfully" });
});

app.use("/api/v1", userRoute);
app.use("/api/v1", courseRoute);

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
