import express from "express";

import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import { createOrder } from "../controllers/order.controller";

const orderRoute = express.Router();

orderRoute.post("/create-order", isAuthenticated, createOrder);

export default orderRoute;
