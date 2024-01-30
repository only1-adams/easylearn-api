import { throwError } from "../helpers/error-helpers.js";

export default class CreatorService {
	constructor(CreatorModel, ClassModel, AttendanceModel) {
		this.Creator = CreatorModel;
		this.Class = ClassModel;
		this.Attendance = AttendanceModel;
	}

	createCreator(creatorDetails) {
		if (!creatorDetails) {
			throwError("Creator Details is required", 422);
		}

		const creator = new this.Creator(creatorDetails);

		return creator.save();
	}

	findCreatorByDepartmentAndLevel(departmentId, level) {
		if (!departmentId) {
			throwError("Department Id is required", 422);
		}

		return this.Creator.findOne({ department: departmentId, level: level });
	}

	findCreatorByUserId(userId) {
		if (!userId) {
			throwError("User Id is required", 422);
		}

		return this.Creator.findOne({ user: userId }).populate({
			path: "department",
			populate: {
				path: "faculty",
				populate: {
					path: "university",
				},
			},
		});
	}

	createClass(classData) {
		if (!classData) {
			throwError("Class Data is required", 422);
		}

		const newClass = new this.Class(classData);

		return newClass.save();
	}

	updateClass(classId, data) {
		if (!classId || !data) {
			throwError("class Id and data is required", 422);
		}

		const updatedClass = this.Class.findByIdAndUpdate(classId, data, {
			runValidators: true,
			returnDocument: "after",
		});

		return updatedClass;
	}

	getCreatorUploadedClasses(creatorId, skip, limit) {
		if (!creatorId) {
			throwError("Creator ID is required", 422);
		}

		return this.Class.find({ creator: creatorId, status: "finished" })
			.sort({
				updatedAt: -1,
			})
			.skip(skip)
			.limit(limit);
	}

	countUploadedClasses(creatorId) {
		if (!creatorId) {
			throwError("Creator ID is required", 422);
		}

		return this.Class.countDocuments({
			creator: creatorId,
			status: "finished",
		});
	}

	getClassdata(classId) {
		if (!classId) {
			throwError("Class ID is required", 422);
		}

		return this.Class.findById(classId);
	}

	getClassAttendance(classId) {
		if (!classId) {
			throwError("Class ID is required", 422);
		}

		return this.Attendance.find({ class: classId }).populate({
			path: "student class",
		});
	}
}
