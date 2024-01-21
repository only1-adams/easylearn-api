import express from "express";
import { body } from "express-validator";
import isAuthenticated from "../middlewares/is-authenticated.js";
import {
	createClass,
	creatorApplication,
	creatorSignin,
	getClassAttendance,
	getClassdata,
	getCreatorClasses,
	getCreatorDetails,
	getClassMessages,
} from "../controllers/creator.controller.js";

const router = express.Router();

router.post(
	"/apply",
	[
		body("department").exists().trim().notEmpty(),
		body("level").exists().isNumeric(),
	],
	creatorApplication
);

router.post(
	"/signin",
	[
		body("email").exists().trim().notEmpty().isEmail(),
		body("password").exists().trim().notEmpty(),
	],
	creatorSignin
);

router.post(
	"/class",
	isAuthenticated,
	[
		body("creator").exists().trim().notEmpty(),
		body("courseTitle").exists().trim().notEmpty(),
		body("courseCode").exists().trim().notEmpty(),
		body("lecturerName").exists().trim().notEmpty(),
	],
	createClass
);

router.get("/me", isAuthenticated, getCreatorDetails);

router.get("/uploaded-classes/:creatorId", isAuthenticated, getCreatorClasses);

router.get("/class/:classId", isAuthenticated, getClassdata);

router.get("/class/attendance/:classId", isAuthenticated, getClassAttendance);

router.get("/class/messages/:classId", isAuthenticated, getClassMessages);

const CreatorRoutes = router;

export default CreatorRoutes;
