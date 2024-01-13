import asyncCatch from "../utils/async-catch.js";
import validateRequestBody from "../utils/validate-request-body.js";
import UniversityModel from "../models/University.model.js";
import FacultyModel from "../models/Faculty.model.js";
import DepartmentModel from "../models/Department.model.js";
import UniversityService from "../services/University.service.js";

const universityService = new UniversityService(
	UniversityModel,
	FacultyModel,
	DepartmentModel
);

export const createUniversity = asyncCatch(async (req, res) => {
	const { name, acronym } = validateRequestBody(req);

	const university = await universityService.createUniversity({
		name,
		acronym,
	});

	res
		.status(200)
		.json({ message: "University created successfully", university });
});

export const createFaculty = asyncCatch(async (req, res) => {
	const { name, university, facultyEmail } = validateRequestBody(req);

	const faculty = await universityService.createFaculty({
		name,
		university,
		facultyEmail,
	});

	res.status(200).json({ message: "Faculty created successfully", faculty });
});

export const createDepartment = asyncCatch(async (req, res) => {
	const { name, faculty } = validateRequestBody(req);

	const department = await universityService.createDepartment({
		name,
		faculty,
	});

	res
		.status(200)
		.json({ message: "Department created successfully", department });
});

export const getAllUniversities = asyncCatch(async (req, res) => {
	const universities = await universityService.getAllUniversities();

	res.status(200).json({ universities });
});

export const getUniversityFaculties = asyncCatch(async (req, res) => {
	const universityId = req.params.universityId;

	const faculties = await universityService.getUniversityFaculties(
		universityId
	);

	res.status(200).json({ faculties });
});

export const getFacultyDepartments = asyncCatch(async (req, res) => {
	const facultyId = req.params.facultyId;

	const departments = await universityService.getFacultyDepartments(facultyId);

	res.status(200).json({ departments });
});

export const verifyStudentProfile = asyncCatch(async (req, res) => {
	const { department, matricNo, studentName } = validateRequestBody(req);

	const studentDepartmentDetails = await universityService.getDepartmentByID(
		department
	);

	res.status(200).json({
		fullName: studentName,
		level: 100,
		matricNo: matricNo,
		department: studentDepartmentDetails,
		expelled: false,
	});
});
