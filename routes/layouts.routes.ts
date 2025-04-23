import express from "express";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from "../controllers/layout.controller";
import { updateAccessToken } from "../controllers/user.controller";

const layoutRoute = express.Router();

layoutRoute.post(
  "/create-layout",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  createLayout
);
layoutRoute.put(
  "/update-layout",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  editLayout
);
layoutRoute.get(
  "/get-layout/:type",
  getLayoutByType
);

export default layoutRoute;
