import { Request, Response, NextFunction, response } from "express";
import { UserModel } from "../models/user.models";
import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler"; // Use ErrorHandler instead
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import cloudinary from "cloudinary";
import { sendEmail } from "../utils/sendMail";
import { Iuser } from "../models/user.models";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/JWT";
import { getUserByID } from "../services/severices";
const createRedisClient = require("../utils/redis");

interface IregisterUser {
  name: string;
  email: string;
  password: string;
  readonly avatar?: string;
}
const redis = createRedisClient();

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
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be between 6 and 10 characters long.",
      });
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
        return next(new ErrorHandler("user with the email already exsit", 400)); // Catch and forward email sending error
      }

      const user = await UserModel.create({
        name,
        email,
        password,
        authType: "local",
      });

      await user.save();
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
  password: string;
}

export const loginUser = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as IloginUser;
      if (!email || !password) {
        return next(new ErrorHandler("Email and password are required", 400));
      }

      const user = await UserModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid user email or password", 400));
      }

      // This method will throw an error if the password doesn't match
      (await user.CompareUserPassword(password)) ?? null;

      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const logOutUser = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Set the cookies with maxAge to expire them immediately
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      await redis.del(req.user?._id || "");

      res.status(200).json({ success: true, message: "Logout successfully" });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user access_token ID
export const updateAccessToken = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token;
      const message = "Could not refress token";

      // veify user credentials from cookies
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESS_TOKEN as string
      ) as JwtPayload;

      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }
      const session = (await redis.get(decoded.id)) as string;

      if (!session) {
        return next(new ErrorHandler(message, 400));
      }

      const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: "5m" }
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: "3d" }
      );

      req.user = user;

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      res.status(200).json({ status: "success", accessToken });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

/// get user byID

export const getUserInfo = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getUserByID(req.user?._id as string, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IsocialAuthBody {
  email: string;
  name: string;
  avatar: string;
  password?: string;
}

export const socialAuth = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as IsocialAuthBody;

      if (!email || !name || !avatar) {
        return next(new ErrorHandler("This field is required", 400));
      }

      const user = await UserModel.findOne({ email });
      if (!user) {
        const newUser = await UserModel.create({
          email,
          name,
          avatar,
          authType: "social",
        });
        sendToken(newUser, 200, res);
        newUser.save();
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Update user Info
interface IupdateUserInfo {
  name: string;
  email: string;
}

export const updateUserInfo = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as IupdateUserInfo;
      const userId = req.user?._id;

      const user = await UserModel.findById(userId);
      if (email && user) {
        const isEmailExsit = await UserModel.findOne({ email });
        if (isEmailExsit) {
          return next(new ErrorHandler("Email is already exsit", 400));
        }

        user.email = email;
      }

      if (name && user) {
        user.name = name;
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user) as string);

      res.status(200).json({
        success: true,
        message: "user email and name updated successfully",
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//update user password

interface IupdateUserPassword {
  newpassword: string;
  oldpassword: string;
}

export const updateUserPassword = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { newpassword, oldpassword } = req.body as IupdateUserPassword;

      if (!(newpassword || oldpassword)) {
        return next(
          new ErrorHandler("Please enter both old and new password", 400)
        );
      }
      const user = await UserModel.findById(req.user?._id).select("+password");

      if (user?.authType === "social" || user?.password === undefined) {
        return next(new ErrorHandler("Invalide user", 400));
      }

      const isPasswordMatch = await user?.CompareUserPassword(oldpassword);

      if (!isPasswordMatch) {
        return next(new ErrorHandler("Incorrect password", 400));
      }

      user.password! = newpassword;

      await user?.save();
      await redis.set(req.user?._id, JSON.stringify(user) as string);

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IupdateUserAvatar {
  avatar: string;
}

export const updateUserAvatar = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IupdateUserAvatar;
      if (!avatar) {
        return next(new ErrorHandler("image is required", 400));
      }

      const userId = req.user?._id;

      const user = await UserModel.findById(userId);
      if (!user) return null;

      if (avatar && user) {
        // first delete user avatar

        if (user?.avatar.public_Id) {
          await cloudinary.v2.uploader.destroy(user.avatar.public_Id, {
            invalidate: false,
          });

          // uploaded the user latest avatar

          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avater",
            width: 150,
            image_metadata: true,
          });

          user.avatar = {
            public_Id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avater",
            width: 150,
            image_metadata: true,
          });

          user.avatar = {
            public_Id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user) as string);

      res.status(200).json({
        success: true,
        message: "Profile image uploaded successfully",
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
