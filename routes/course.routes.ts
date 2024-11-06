import express from "express";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import {
  getAllleCourse,
  getSingleCourse,
  updateCourse,
  uploadCourse,
} from "../controllers/course.controller";

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
courseRoute.get("/getsingle-course/:id", getSingleCourse);
courseRoute.get("/getall-course", getAllleCourse);

export default courseRoute;
