import express from "express";
import { registerationUser } from "../controllers/user.controller";

const userRoute = express.Router();

userRoute.post("/registration", registerationUser);

export default userRoute;
