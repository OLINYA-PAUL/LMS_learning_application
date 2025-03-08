import express from "express";
import {
  getAllNotification,
  updateNotification,
} from "../controllers/notification.controller";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import { updateAccessToken } from "../controllers/user.controller";

const notificationRoutes = express.Router();

notificationRoutes.get(
  "/get-all-notifications",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  getAllNotification
);

notificationRoutes.put(
  "/update-notifications/:id",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  updateNotification
);

export default notificationRoutes;
