import express from "express";
import { body } from "express-validator";
import isAuthenticated from "../middlewares/is-authenticated.js";
import {
	createStudent,
	getStudentLives,
	getStudentProfile,
	getStudentRecordedClass,
	markAttendance,
	updateStudentProfile,
	uploadProfilePic,
} from "../controllers/student-controller.js";

const router = express.Router();

router.post(
	"/",
	[
		body("department").trim().notEmpty(),
		body("fullName").trim().notEmpty(),
		body("matricNo").trim().notEmpty(),
		body("level").exists().isNumeric(),
		body("expelled").exists().isBoolean(),
	],
	isAuthenticated,
	createStudent
);

router.put(
	"/",
	[
		body("department").trim().optional().notEmpty(),
		body("fullName").trim().optional().notEmpty(),
		body("matricNo").trim().optional().notEmpty(),
		body("level").optional().isNumeric(),
		body("expelled").optional().isBoolean(),
		body("profilePicture").optional().isString(),
	],
	isAuthenticated,
	updateStudentProfile
);

router.get("/", isAuthenticated, getStudentProfile);

router.get("/liveclasses", isAuthenticated, getStudentLives);

router.get("/class/recorded", isAuthenticated, getStudentRecordedClass);

router.post("/attendance/:classId", isAuthenticated, markAttendance);

router.post(
	"/upload/:fileType/:fileExtension",
	isAuthenticated,
	uploadProfilePic
);

const StudentRoutes = router;

export default StudentRoutes;
