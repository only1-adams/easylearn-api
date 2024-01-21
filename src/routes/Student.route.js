import express from "express";
import { body } from "express-validator";
import isAuthenticated from "../middlewares/is-authenticated.js";
import {
	createStudent,
	getStudentLives,
	getStudentProfile,
	markAttendance,
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

router.get("/", isAuthenticated, getStudentProfile);

router.get("/liveclasses", isAuthenticated, getStudentLives);

router.post("/attendance/:classId", isAuthenticated, markAttendance);

const StudentRoutes = router;

export default StudentRoutes;
