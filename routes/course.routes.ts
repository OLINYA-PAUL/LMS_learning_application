import express from "express";
import { authoriseUserRole, isAuthenticated } from "../middleware/auth";
import {
  addAnswer,
  addCommenToReview,
  addQuestions,
  addReview,
  deleteCourse,
  getAdminAllCourse,
  getAllCourses,
  getCourseByUser,
  getSingleCourse,
  updateCourse,
  uploadCourse,
  generateVideoUrl,
  deleteUserReview
} from "../controllers/course.controller";
import { getCoursesAnalysis } from "../controllers/analysis.controller";
import { updateAccessToken } from "../controllers/user.controller";

const courseRoute = express.Router();

courseRoute.post(
  "/create-course",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  uploadCourse
);
courseRoute.put(
  "/update-course/:id",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  updateCourse
);
courseRoute.get("/getsingle-course/:id", getSingleCourse);
courseRoute.get("/getall-course", getAllCourses);
courseRoute.get(
  "/getcourse-content/:id",
  updateAccessToken,
  isAuthenticated,
  getCourseByUser
);
courseRoute.put(
  "/addcourse-question",
  updateAccessToken,
  isAuthenticated,
  addQuestions
);
courseRoute.put(
  "/addcourse-answer",
  updateAccessToken,
  isAuthenticated,
  addAnswer
);
courseRoute.put(
  "/addcourse-review/:id",
  updateAccessToken,
  isAuthenticated,
  addReview
);
courseRoute.put(
  "/addreply-to-review",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  addCommenToReview
);

courseRoute.get(
  "/get-admin-all-courses",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  getAdminAllCourse
);

courseRoute.delete(
  "/delete-course/:id",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  deleteCourse
);
courseRoute.get(
  "/courses-analysis",
  updateAccessToken,
  isAuthenticated,
  authoriseUserRole("admin"),
  getCoursesAnalysis
);


courseRoute.delete(
  "/delete-review/:id",
  updateAccessToken,
  isAuthenticated,
    authoriseUserRole("admin"),

  deleteUserReview
);


courseRoute.post("/getVideo-url", generateVideoUrl);

export default courseRoute;
