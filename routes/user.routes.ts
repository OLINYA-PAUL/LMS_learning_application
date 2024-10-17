import express from "express";
import {
  activateUser,
  registerationUser,
} from "../controllers/user.controller";

const userRoute = express.Router();

userRoute.post("/registration", registerationUser);
userRoute.post("/activate-user", activateUser);

export default userRoute;
