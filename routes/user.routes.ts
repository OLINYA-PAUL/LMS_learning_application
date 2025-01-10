import express from "express";
import {
  activateUser,
  deleteUsers,
  getAllUsers,
  getUserInfo,
  loginUser,
  logOutUser,
  registerationUser,
  socialAuth,
  updateAccessToken,
  updateUserAvatar,
  updateUserInfo,
  updateUserPassword,
  updateUsersRolles,
} from "../controllers/user.controller";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import { updateUsersRollesService } from "../services/user.service";
import { getUsersAnalysis } from "../controllers/analysis.controller";

const userRoute = express.Router();

userRoute.post("/registration", registerationUser);
userRoute.post("/activate-user", activateUser);
userRoute.post("/login-user", loginUser);
userRoute.post("/social-auth", socialAuth);
userRoute.get("/logout-user", isAuthenticated, logOutUser);
userRoute.get("/refresh-token", isAuthenticated, updateAccessToken);
userRoute.get("/me", updateAccessToken, isAuthenticated, getUserInfo);
userRoute.put(
  "/updateuser-info",
  updateAccessToken,
  isAuthenticated,
  updateUserInfo
);
userRoute.put(
  "/updateuser-password",
  updateAccessToken,
  isAuthenticated,
  updateUserPassword
);
userRoute.put(
  "/updateuser-avatar",
  updateAccessToken,
  isAuthenticated,
  updateUserAvatar
);
userRoute.get(
  "/get-all-users",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  getAllUsers
);

userRoute.put(
  "/update-users-roles",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  updateUsersRolles
);

userRoute.delete(
  "/delete-users/:id",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  deleteUsers
);

userRoute.get(
  "/users-analysis",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  getUsersAnalysis
);

export default userRoute;
