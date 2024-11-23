import express from "express";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import {
  getCoursesAnalysis,
  getOrdersAnalysis,
  getUsersAnalysis,
} from "../controllers/analysis.controller";

const analysisRoute = express.Router();

analysisRoute.get(
  "/get-user-analysis",
  isAuthenticated,
  authoriseUserRole("admin"),
  getUsersAnalysis
);
analysisRoute.get(
  "/get-courses-analysis",
  isAuthenticated,
  authoriseUserRole("admin"),
  getCoursesAnalysis
);
analysisRoute.get(
  "/get-orders-analysis",
  isAuthenticated,
  authoriseUserRole("admin"),
  getOrdersAnalysis
);

export default analysisRoute;
