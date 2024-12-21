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
userRoute.get("/me", isAuthenticated, getUserInfo);
userRoute.put("/updateuser-info", isAuthenticated, updateUserInfo);
userRoute.put("/updateuser-password", isAuthenticated, updateUserPassword);
userRoute.put("/updateuser-avatar", isAuthenticated, updateUserAvatar);
userRoute.get(
  "/get-all-users",
  isAuthenticated,
  authoriseUserRole("admin"),
  getAllUsers
);

userRoute.put(
  "/update-users-roles",
  isAuthenticated,
  authoriseUserRole("admin"),
  updateUsersRolles
);

userRoute.delete(
  "/delete-users/:id",
  isAuthenticated,
  authoriseUserRole("admin"),
  deleteUsers
);

userRoute.get(
  "/users-analysis",
  isAuthenticated,
  authoriseUserRole("admin"),
  getUsersAnalysis
);

export default userRoute;
