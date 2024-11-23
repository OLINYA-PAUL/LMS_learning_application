import express from "express";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import {
  addAnswer,
  addCommenToReview,
  addQuestions,
  addReview,
  deleteCourse,
  getAllCourses,
  getAllleCourse,
  getCourseByUser,
  getSingleCourse,
  updateCourse,
  uploadCourse,
} from "../controllers/course.controller";
import { getCoursesAnalysis } from "../controllers/analysis.controller";

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
courseRoute.put("/addcourse-review/:id", isAuthenticated, addReview);
courseRoute.put(
  "/addreply-to-review",
  isAuthenticated,
  authoriseUserRole("admin"),
  addCommenToReview
);

courseRoute.get(
  "/get-all-courses",
  isAuthenticated,
  authoriseUserRole("admin"),
  getAllCourses
);

courseRoute.delete(
  "/delete-course/:id",
  isAuthenticated,
  authoriseUserRole("admin"),
  deleteCourse
);

courseRoute.get(
  "/courses-analysis",
  isAuthenticated,
  authoriseUserRole("admin"),
  getCoursesAnalysis
);

export default courseRoute;
