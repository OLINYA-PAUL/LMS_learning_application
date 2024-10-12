//@ts-ignore
const { NextFunction, Request, Response } = require("express");
//@ts-ignore
const { errorHandler } = require("../utils/errorHandler");

const errorMiddleWareHandler = (
  err: any,
  req: Request,
  res: Response,
  //@ts-ignore
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";

  // Wrong mogodb url ID
  if (err.name === "CastError") {
    const message = `Resourcess not found. invalide  ${err.path}`;
    err = new errorHandler(message, 400);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new errorHandler(message, 400);
  }

  // Wrong jwt error
  if (err.name === "jsonWebTokenError") {
    const message = "invalide JWT token entered pls! try again";
    err = new errorHandler(message, 400);
  }

  // JWT expired error

  if (err.name === "TokenExpiredError") {
    const message = "invalide JWT token expired pls! try again";
    err = new errorHandler(message, 400);
  }

  //@ts-ignore
  res.status(err.statusCode).json({
    success: false,
    err: err.message,
  });
};

module.exports = { errorMiddleWareHandler };
