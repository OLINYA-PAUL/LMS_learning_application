import express from "express";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from "../controllers/layout.controller";

const layoutRoute = express.Router();

layoutRoute.post(
  "/create-layout",
  isAuthenticated,
  authoriseUserRole("admin"),
  createLayout
);
layoutRoute.post(
  "/update-layout",
  isAuthenticated,
  authoriseUserRole("admin"),
  editLayout
);
layoutRoute.get("/get-layout", getLayoutByType);

export default layoutRoute;
