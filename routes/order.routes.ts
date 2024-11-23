import express from "express";

import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import {
  createOrder,
  deleteOrders,
  getAllOrders,
} from "../controllers/order.controller";
import { getOrdersAnalysis } from "../controllers/analysis.controller";

const orderRoute = express.Router();

orderRoute.post("/create-order", isAuthenticated, createOrder);

orderRoute.get(
  "/get-all-orders",
  isAuthenticated,
  authoriseUserRole("admin"),
  getAllOrders
);

orderRoute.delete(
  "/delete-orders/:id",
  isAuthenticated,
  authoriseUserRole("admin"),
  deleteOrders
);

orderRoute.get(
  "/orders-analysis",
  isAuthenticated,
  authoriseUserRole("admin"),
  getOrdersAnalysis
);

export default orderRoute;
