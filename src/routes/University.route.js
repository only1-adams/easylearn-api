import express from "express";
import { body } from "express-validator";
import {
	createDepartment,
	createFaculty,
	createUniversity,
	getAllUniversities,
	getFacultyDepartments,
	getUniversityFaculties,
	verifyStudentProfile,
} from "../controllers/university.controller.js";
import isAuthenticated from "../middlewares/is-authenticated.js";

const router = express.Router();

router.post(
	"/",
	[body("name").trim().notEmpty(), body("acronym").trim().notEmpty()],
	createUniversity
);

router.post(
	"/faculty/",
	[
		body("name").trim().notEmpty(),
		body("university").trim().notEmpty(),
		body("facultyEmail")
			.trim()
			.notEmpty()
			.withMessage("Faculty email is required")
			.isEmail()
			.withMessage("Provide a valid email address"),
	],
	createFaculty
);

router.post(
	"/department",
	[body("name").trim().notEmpty(), body("faculty").trim().notEmpty()],
	createDepartment
);

router.get("/", getAllUniversities);

router.get("/faculty/:universityId", getUniversityFaculties);

router.get("/department/:facultyId", getFacultyDepartments);

router.post(
	"/verify",
	[
		body("department").trim().notEmpty(),
		body("matricNo").trim().notEmpty(),
		body("studentName").trim().notEmpty(),
	],
	isAuthenticated,
	verifyStudentProfile
);

const UniversityRoutes = router;

export default UniversityRoutes;
