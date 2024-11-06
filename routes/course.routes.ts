import express from "express";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import { updateCourse, uploadCourse } from "../controllers/course.controller";

const courseRoute = express.Router();

courseRoute.post(
  "/create-course",
  isAuthenticated,
  authoriseUserRole("admin"),
  uploadCourse
);
courseRoute.put(
  "/update-course/:id",
  isAuthenticated,
  authoriseUserRole("admin"),
  updateCourse
);

export default courseRoute;
