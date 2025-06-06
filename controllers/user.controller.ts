require("dotenv").config();

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
import {
  getAllUsersServices,
  getUserByID,
  updateUsersRollesService,
} from "../services/user.service";
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
    if (password.length < 8) {
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
  activation_code: string;
}

export const activateUser = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IactivationToken;

      const newUser: { user: Iuser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as Secret // Secret key
      ) as { user: Iuser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
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
      res.status(201).json({
        sucess: true,
        message: " account created ",
      });

      // sendToken(user, 200, res);
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
      (await user.CompareUserPassword(password)) || "";

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
    const refresh_token = req.cookies.refresh_token;

    // Check if refresh token exists
    if (!refresh_token) {
      return next(new ErrorHandler("Refresh token not provided", 401));
    }

    // Verify refresh token
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;
    } catch (error) {
      return next(new ErrorHandler("Invalid or expired refresh token", 401));
    }

    if (!decoded.id) {
      return next(new ErrorHandler("Invalid token format", 401));
    }

    // Get user session from Redis
    let session = await redis.get(decoded.id);
    let user;

    // If no Redis session, try to get user from database
    if (!session) {
      const userFromDb = await UserModel.findById(decoded.id);

      if (!userFromDb) {
        return next(
          new ErrorHandler("User not found, please login again", 401)
        );
      }

      // Create a new session for valid user found in database
      user = userFromDb;

      // Store user in Redis for future requests
      await redis.set(decoded.id, JSON.stringify(user), "EX", 604800); // 7 days
    } else {
      // Parse the session data
      try {
        user = JSON.parse(session);
      } catch (error) {
        return next(
          new ErrorHandler("Invalid session data, please login again", 500)
        );
      }

      // Validate parsed user data
      if (!user || !user._id) {
        return next(
          new ErrorHandler("Corrupted session data, please login again", 500)
        );
      }
    }

    // Generate new tokens
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN as string,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN as string,
      { expiresIn: "3d" }
    );

    // Attach user to request
    req.user = user;

    // Set cookies with new tokens
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    // Update Redis session (use user._id consistently)
    await redis.set(user._id, JSON.stringify(user), "EX", 604800); // 7 days

    if (req.path === "/refresh-token") {
      return res.json({
        message: "Access token refreshed successfully",
        accessToken,
      });
    }

    next();
  }
);

/// get user byID

export const getUserInfo = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      console.log({ userID: userId });
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID is missing" });
      }

      await getUserByID(userId as string, res, next); // Pass res and next to handle response and error
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400)); // Catch and pass errors to the error handler
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
        // newUser.save();
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
      const { name } = req.body as IupdateUserInfo;
      const userId = req.user?._id;

      const user = await UserModel.findById(userId);

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
      const { oldpassword, newpassword } = req.body as IupdateUserPassword;

      if (!(oldpassword || newpassword)) {
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
      if (!avatar) return next(new ErrorHandler("Image is required", 400));

      const userId = req.user?._id;
      const user = await UserModel.findById(userId);
      if (!user) return next(new ErrorHandler("No user found", 400));

      let myCloud;
      if (user?.avatar?.public_Id) {
        // Delete old avatar
        await cloudinary.v2.uploader.destroy(user.avatar.public_Id, {
          invalidate: true, // Ensures the old image is fully removed
        });
      }

      // Upload new avatar
      myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatar",
        width: 150,
        image_metadata: true,
      });

      user.avatar = {
        public_Id: myCloud.public_id,
        url: myCloud.secure_url,
      };

      user.markModified("avatar"); // Ensure Mongoose detects the change
      await user.save();

      // Refresh Redis Cache (Optional)
      await redis.del(userId); // Delete old cache
      await redis.set(userId, JSON.stringify(user)); // Store updated user

      res.status(200).json({
        success: true,
        message: "Profile image updated successfully",
        user,
      });
    } catch (error: any) {
      console.error("Avatar Update Error:", error.message);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all users
export const getAllUsers = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getAllUsersServices(res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// updates user roles

interface IUserRoles {
  id: string;
  role: string;
}

export const updateUsersRolles = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, role } = req.body as IUserRoles;

      await updateUsersRollesService(res, id, role, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//delete users

interface IDeleteUser {
  id: string;
}

export const deleteUsers = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if the authenticated user is an admin
    if (req.user?.role !== "admin") {
      return next(new ErrorHandler("Not authorized to delete users", 403));
    }

    // Use the provided `id` from the  params for deletion
    const user = await UserModel.findByIdAndDelete(id);

    if (!user) {
      return next(new ErrorHandler("No user with such ID", 404));
    }

    await redis.del(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  }
);
