require("dotenv").config();
import { Response, Request, NextFunction } from "express";
import { UserModel } from "../models/user.models";
import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import { errorMiddleWareHandler } from "../middleware/error";
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
    try {
      const { name, email, password, avatar } = req.body as IregisterUser;

      const isEmailExsit = await UserModel.findOne({ email });
      if (!isEmailExsit) {
        return next(
          //@ts-ignore
          new errorMiddleWareHandler(
            "Email is required for this operation",
            400
          )
        );
      }

      const user: IregisterUser = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = { user: { ...user, name }, activationCode };
      await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      try {
        await sendEmail({
          email: user.email,
          subject: "Please activate your account!!",
          template: "activation-mail.ejs",
          data,
        });
        res.status(201).json({
          sucess: true,
          message: " Please check your email to activate your account",
          activationToken: activationToken.activationCode,
        });
      } catch (error: any) {
        //@ts-ignore
        new errorMiddleWareHandler(error.message, 400);
      }
    } catch (error: any) {
      return next(
        //@ts-ignore
        new errorMiddleWareHandler(error.message, 400)
      );
    }
  }
);
{
}

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
