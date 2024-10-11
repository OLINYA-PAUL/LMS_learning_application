import { NextFunction, Request, Response } from "express";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

//@ts-ignore
const app = express();

app.use(express.json({ limit: "50mb" }));

app.use(
  cors({
    origin: process.env.ORIGIN, // Allows the origin specified in environment variables
    methods: ["GET", "POST", "PUT", "DELETE"], // Restricts to these HTTP methods
    allowedHeaders: ["Authorization", "Content-Type"], // Allows these headers
    credentials: true, // Allows cookies and other credentials
    maxAge: 3600, // Caches the preflight request for 1 hour
    optionsSuccessStatus: 204, // Ensures older browsers like IE11 handle OPTIONS responses correctly
  })
);

app.use(cookieParser());

app.get("/test", (req: Request, res: Response, nest: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "api is working",
  });
  console.log("");
});

app.get("*", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    error: true,
    errorMessage: new Error(
      `The route you serach ${req.originalUrl} is not available please go back to home page`
    ),
    errorMessagestatusCode: 404,
  });
  console.log("");
  next(new Error());
});

module.exports = { app };
