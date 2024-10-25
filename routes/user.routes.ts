import express from "express";
import {
  activateUser,
  loginUser,
  logOutUser,
  registerationUser,
} from "../controllers/user.controller";

const userRoute = express.Router();

userRoute.post("/registration", registerationUser);
userRoute.post("/activate-user", activateUser);
userRoute.post("/login-user", loginUser);
userRoute.get("/logout-user", logOutUser);

export default userRoute;
