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

	getStudentByUserId(userId) {
		if (!userId) {
			throwError("User Id must be provided", 422);
		}

		return this.Student.findOne({ user: userId }).populate({
			path: "department",
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
}
