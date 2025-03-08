import express from "express";

import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import {
  createOrder,
  deleteOrders,
  getAllOrders,
} from "../controllers/order.controller";
import { updateAccessToken } from "../controllers/user.controller";
import { getOrdersAnalysis } from "../controllers/analysis.controller";

const orderRoute = express.Router();

orderRoute.post("/create-order", isAuthenticated, createOrder);

orderRoute.get(
  "/get-all-orders",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  getAllOrders
);

orderRoute.delete(
  "/delete-orders/:id",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  deleteOrders
);

orderRoute.get(
  "/orders-analysis",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  getOrdersAnalysis
);

export default orderRoute;
