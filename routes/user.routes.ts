import express from "express";
import {
  activateUser,
  getUserInfo,
  loginUser,
  logOutUser,
  registerationUser,
  socialAuth,
  updateAccessToken,
  updateUserInfo,
  updateUserPassword,
} from "../controllers/user.controller";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";

const userRoute = express.Router();

userRoute.post("/registration", registerationUser);
userRoute.post("/activate-user", activateUser);
userRoute.post("/login-user", loginUser);
userRoute.post("/social-auth", socialAuth);
userRoute.get("/logout-user", isAuthenticated, logOutUser);
userRoute.get("/refresh-token", updateAccessToken);
userRoute.get("/getuser-id", isAuthenticated, getUserInfo);
userRoute.put("/updateuser-info", isAuthenticated, updateUserInfo);
userRoute.put("/updateuser-password", isAuthenticated, updateUserPassword);

export default userRoute;
