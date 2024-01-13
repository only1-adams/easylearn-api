import { throwError } from "../helpers/error-helpers.js";

class UniversityService {
	constructor(UniversityModel, FacultyModel, DepartmentModel) {
		this.University = UniversityModel;
		this.Faculty = FacultyModel;
		this.Department = DepartmentModel;
	}

	createUniversity(universityDetails) {
		if (!universityDetails) {
			throwError("Please provide university details", 422);
		}

		const university = new this.University(universityDetails);

		return university.save();
	}

	createFaculty(facultyDetails) {
		if (!facultyDetails) {
			throwError("Faculty details must be provided", 422);
		}

		const faculty = new this.Faculty(facultyDetails);

		return faculty.save();
	}

	createDepartment(departmentDetails) {
		if (!departmentDetails) {
			throwError("Department details must be provided", 422);
		}

		const department = new this.Department(departmentDetails);

		return department.save();
	}

	getAllUniversities() {
		return this.University.find();
	}

	getUniversityFaculties(universityId) {
		if (!universityId) {
			throwError("UniversityId must be provided", 422);
		}

		return this.Faculty.find({ university: universityId });
	}

	getFacultyDepartments(facultyId) {
		if (!facultyId) {
			throwError("FacultyId must be provided", 422);
		}

		return this.Department.find({ faculty: facultyId }).populate({
			path: "faculty",
			populate: "university",
		});
	}

	getDepartmentByID(departmentId) {
		if (!departmentId) {
			throwError("Department ID must be provided", 422);
		}

		return this.Department.findById(departmentId).populate({
			path: "faculty",
			populate: "university",
		});
	}
}

export default UniversityService;
