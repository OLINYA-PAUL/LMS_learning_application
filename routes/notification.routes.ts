import express from "express";
import {
  getAllNotification,
  updateNotification,
} from "../controllers/notification.controller";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";

const notificationRoutes = express.Router();

notificationRoutes.get(
  "/get-all-notifications",
  isAuthenticated,
  authoriseUserRole("admin"),
  getAllNotification
);

notificationRoutes.put(
  "/update-notifications/:id",
  isAuthenticated,
  authoriseUserRole("admin"),
  updateNotification
);

export default notificationRoutes;
