import asyncCatch from "../utils/async-catch.js";
import validateRequestBody from "../utils/validate-request-body.js";
import StudentModel from "../models/Student.model.js";
import ClassModel from "../models/Class.model.js";
import AttendanceModel from "../models/Attendance.model.js";
import StudentService from "../services/Student.service.js";
import { throwError } from "../helpers/error-helpers.js";

const studentService = new StudentService(
	StudentModel,
	ClassModel,
	AttendanceModel
);

export const createStudent = asyncCatch(async (req, res) => {
	const user = req.user;
	const { department, fullName, matricNo, level, expelled } =
		validateRequestBody(req);

	const existingStudent = await studentService.getStudentByMatricNo(matricNo);

	if (existingStudent) {
		throwError(
			"An account has already been verified with your matric no.",
			400
		);
	}

	const student = await studentService.createStudent({
		user,
		department,
		fullName,
		matricNo,
		level,
		expelled,
	});

	res.status(200).json({ message: "Student Profile Created", student });
});

export const getStudentProfile = asyncCatch(async (req, res) => {
	const user = req.user;

	const student = await studentService.getStudentByUserId(user._id);

	res.status(200).json({ student });
});

export const getStudentLives = asyncCatch(async (req, res) => {
	const user = req.user;

	const student = await studentService.getStudentByUserId(user._id);

	const lives = await studentService.getStudentLiveClasses(
		student.department,
		student.level
	);

	res.status(200).json({ lives });
});

export const markAttendance = asyncCatch(async (req, res) => {
	const user = req.user;
	const classId = req.params.classId;
	const student = await studentService.getStudentByUserId(user._id);

	const attendance = await studentService.markStudentAttendance(
		student._id,
		classId
	);

	res
		.status(200)
		.json({ message: "Attendance successfully registered!", attendance });
});
