import express from "express";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import {
  addAnswer,
  addQuestions,
  getAllleCourse,
  getCourseByUser,
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
courseRoute.get("/getcourse-content/:id", isAuthenticated, getCourseByUser);
courseRoute.put("/addcourse-question", isAuthenticated, addQuestions);
courseRoute.put("/addcourse-answer", isAuthenticated, addAnswer);

export default courseRoute;
