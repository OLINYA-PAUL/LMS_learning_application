import express from "express";
import {
  activateUser,
  loginUser,
  logOutUser,
  registerationUser,
  updateAccessToken,
} from "../controllers/user.controller";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";

const userRoute = express.Router();

userRoute.post("/registration", registerationUser);
userRoute.post("/activate-user", activateUser);
userRoute.post("/login-user", loginUser);
userRoute.get("/logout-user", isAuthenticated, logOutUser);
userRoute.get("/refresh-token", updateAccessToken);

export default userRoute;
