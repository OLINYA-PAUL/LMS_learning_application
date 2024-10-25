import express from "express";
import {
  activateUser,
  loginUser,
  logOutUser,
  registerationUser,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth";

const userRoute = express.Router();

userRoute.post("/registration", registerationUser);
userRoute.post("/activate-user", activateUser);
userRoute.post("/login-user", loginUser);
userRoute.get("/logout-user", isAuthenticated, logOutUser);

export default userRoute;
