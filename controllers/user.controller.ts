import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.models";
import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler"; // Use ErrorHandler instead
import jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import { sendEmail } from "../utils/sendMail";
import { Iuser } from "../models/user.models";
import bcrypt from "bcryptjs";
import { sendToken } from "../utils/JWT";

interface IregisterUser {
  name: string;
  email: string;
  password: string;
  readonly avatar?: string;
}

export const registerationUser = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, avatar } = req.body as IregisterUser;

    if (!email) {
      return next(new ErrorHandler("Email is required", 400));
    }

    // Check if email already exists
    const isEmailExsit = await UserModel.findOne({ email });
    if (isEmailExsit) {
      return next(new ErrorHandler("Email already exists", 400)); // Correct usage of ErrorHandler
    }

    // Validate password length BEFORE hashing
    if (password.length < 6 || password.length > 10) {
      return res.status(400).json({
        success: false,
        error: "Password must be between 6 and 10 characters long.",
      });
    }

    // If password is valid, hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user: IregisterUser = {
      name,
      email,
      password: hashedPassword,
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
        email,
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

// Activation token

interface IactivationToken {
  activation_token: string;
  actvation_code: string;
}

export const activateUser = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, actvation_code } = req.body as IactivationToken;
      const newUser: { user: Iuser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as Secret // Secret key
      ) as { user: Iuser; activationCode: string };

      if (newUser.activationCode !== actvation_code) {
        return next(new ErrorHandler("invalide activation code entered", 500)); // Catch and forward email sending error
      }

      const { name, email, password } = newUser.user;

      const userExsite = await UserModel.findOne({ email });
      if (userExsite) {
        return next(new ErrorHandler("user with the email already exsit", 500)); // Catch and forward email sending error
      }

      const user = await UserModel.create({
        name,
        email,
        password,
      });

      res
        .status(201)
        .json({ sucess: true, message: "user created successfully 💖" });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500)); // Catch and forward email sending error
    }
  }
);

// login user

interface IloginUser {
  email: string;
  passWord: string | number;
}

export const loginUser = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, passWord } = req.body as IloginUser;
      if (!email || passWord) {
        return next(new ErrorHandler("Email and password is required", 500));
      }

      const user = await UserModel.find({ email }).select("+passWord");
      if (!user) {
        return next(new ErrorHandler("Invalide user email or password", 500));
      }

      //@ts-ignore
      const comparePassWord = await user.CompareUserPassword(passWord);
      if (!comparePassWord) {
        return next(new ErrorHandler("Invalide user email or password", 500));
      }

      //@ts-ignore
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
