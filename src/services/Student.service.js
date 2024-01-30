import { throwError } from "../helpers/error-helpers.js";

export default class StudentService {
	constructor(StudentModel, ClassModel, AttendanceModel) {
		this.Student = StudentModel;
		this.Class = ClassModel;
		this.Attendance = AttendanceModel;
	}

	createStudent(studentDetails) {
		if (!studentDetails) {
			throwError("Student details must be provided", 422);
		}

		const student = new this.Student(studentDetails);

		return student.save();
	}

	updateStudent(studentId, data) {
		if (!studentId) {
			throwError("Student id must be provided", 422);
		}

		if (!data) {
			throwError("Student data must be provided", 422);
		}

		return this.Student.findByIdAndUpdate(studentId, data, {
			runValidators: true,
			returnDocument: "after",
		});
	}

	getStudentByUserId(userId) {
		if (!userId) {
			throwError("User Id must be provided", 422);
		}

		return this.Student.findOne({ user: userId }).populate({
			path: "department",
			populate: {
				path: "faculty",
				populate: "university",
			},
		});
	}

	getStudentByMatricNo(matricNo) {
		if (!matricNo) {
			throwError("Matric No must be provided", 422);
		}

		return this.Student.findOne({ matricNo });
	}

	getStudentLiveClasses(departmentId, level) {
		if (!departmentId) {
			throwError("Department Id must be provided", 422);
		}

		return this.Class.find({ status: "ongoing" })
			.populate({
				path: "creator",
				match: { department: departmentId, level },
			})
			.sort({
				updatedAt: -1,
			});
	}

	markStudentAttendance(studentId, classId) {
		if (!studentId || !classId) {
			throwError("Student and Class ID must be provided", 422);
		}

		const attendance = new this.Attendance({
			class: classId,
			student: studentId,
		});

		return attendance.save();
	}

	getStudentClassRecords(departmentId, level) {
		if (!departmentId) {
			throwError("Department Id must be provided", 422);
		}

		if (!level) {
			throwError("Level must be provided", 422);
		}

		return this.Class.find({
			status: "finished",
			recordUrl: { $exists: true, $ne: null },
		})
			.populate({
				path: "creator",
				match: { department: departmentId, level },
			})
			.sort({
				updatedAt: -1,
			});
	}
}
