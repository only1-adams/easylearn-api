import asyncCatch from "../utils/async-catch.js";
import validateRequestBody from "../utils/validate-request-body.js";
import StudentModel from "../models/Student.model.js";
import ClassModel from "../models/Class.model.js";
import AttendanceModel from "../models/Attendance.model.js";
import StarredClassModel from "../models/StarredClass.js";
import StudentService from "../services/Student.service.js";
import { throwError } from "../helpers/error-helpers.js";
import { uploadProfilePicture } from "../helpers/upload-helpers.js";

const studentService = new StudentService(
	StudentModel,
	ClassModel,
	AttendanceModel,
	StarredClassModel
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

export const updateStudentProfile = asyncCatch(async (req, res) => {
	const user = req.user;
	const data = validateRequestBody(req);

	const student = await studentService.getStudentByUserId(user._id);

	const newData = await studentService.updateStudent(student._id, data);

	res
		.status(200)
		.json({ message: "Student Profile Updated", student: newData });
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

	const filteredClasses = lives.filter((c) => c.creator !== null);

	res.status(200).json({ lives: filteredClasses });
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

export const getStudentRecordedClass = asyncCatch(async (req, res) => {
	const user = req.user;
	const student = await studentService.getStudentByUserId(user._id);

	const recordedClasses = await studentService.getStudentClassRecords(
		student.department,
		student.level
	);

	const filteredClasses = recordedClasses.filter((c) => c.creator !== null);

	res.status(200).json({ recordedClasses: filteredClasses });
});

export const uploadProfilePic = asyncCatch(async (req, res) => {
	const user = req.user;
	const fileType = req.params.fileType;
	const fileExtension = req.params.fileExtension;

	const student = await studentService.getStudentByUserId(user._id);

	const { url, key } = await uploadProfilePicture(
		fileType,
		fileExtension,
		student._id
	);

	res.status(200).json({ url, key });
});

export const getStarredClass = asyncCatch(async (req, res) => {
	const user = req.user;
	const student = await studentService.getStudentByUserId(user._id);

	const classes = await studentService.getstarredClass(student._id);

	res.status(200).json({ classes: classes });
});

export const createStarredClass = asyncCatch(async (req, res) => {
	const user = req.user;
	const student = await studentService.getStudentByUserId(user._id);

	const classId = req.params.classId;

	await studentService.createStarredClass(student._id, classId);

	res.status(200).json({ messsage: "Class starred successfully" });
});

export const removeStarredClass = asyncCatch(async (req, res) => {
	const user = req.user;
	const student = await studentService.getStudentByUserId(user._id);

	const classId = req.params.classId;

	await studentService.removeStarred(student._id, classId);

	res.status(200).json({ messsage: "Class removed from starred" });
});

export const getDepartmentStudents = asyncCatch(async (req, res) => {
	const departmentId = req.params.department;
	const level = req.params.level;

	const students = await studentService.getDepartmentStudents(
		departmentId,
		Number(level)
	);

	res.status(200).json({ students });
});
