import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.models";
import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler"; // Use ErrorHandler instead
import jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import { sendEmail } from "../utils/sendMail";

interface IregisterUser {
  name: string;
  email: string;
  password: string;
  readonly avatar?: string;
}

export const registerationUser = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, avatar } = req.body as IregisterUser;
    // console.log("Received user data:", { xxxxxx: name, email, password });
    if (!email) {
      return next(new ErrorHandler("Email is required", 400));
    }

    // Check if email already exists
    const isEmailExsit = await UserModel.findOne({ email });
    if (isEmailExsit) {
      return next(new ErrorHandler("Email already exists", 400)); // Correct usage of ErrorHandler
    }

    const user: IregisterUser = {
      name,
      email,
      password,
    };

    const { token, activationCode } = createActivationToken(user);

    const data = { user: { ...user, name }, activationCode };

    // Render email template
    await ejs.renderFile(
      path.join(__dirname, "../mails/activation-mail.ejs"),
      data
    );

    try {
      // Send email
      await sendEmail({
        email: user.email,
        subject: "Please activate your account!!",
        template: "activation-mail.ejs",
        data,
      });

      res.status(201).json({
        success: true,
        message: "Please check your email to activate your account",
        activationToken: token,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500)); // Catch and forward email sending error
    }
  }
);

interface activationToken {
  token: string;
  activationCode: string;
}

const createActivationToken = (user: any): activationToken => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const token = jwt.sign(
    { user, activationCode }, // Payload
    process.env.ACTIVATION_SECRET as Secret, // Secret key
    { expiresIn: "5m" } // Options (expiration time)
  );

  return { token, activationCode };
};
