import { throwError } from "../helpers/error-helpers.js";

export default class StudentService {
	constructor(StudentModel, ClassModel) {
		this.Student = StudentModel;
		this.Class = ClassModel;
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

		return this.Student.findOne({ user: userId });
	}

	getStudentLiveClasses(departmentId) {
		if (!departmentId) {
			throwError("Department Id must be provided", 422);
		}

		return this.Class.find({ status: "ongoing" }).populate({
			path: "creator",
			match: { department: departmentId },
		});
	}
}
