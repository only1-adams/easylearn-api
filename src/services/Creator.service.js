import { throwError } from "../helpers/error-helpers.js";

export default class CreatorService {
	constructor(CreatorModel, ClassModel) {
		this.Creator = CreatorModel;
		this.Class = ClassModel;
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

		return this.Creator.findOne({ user: userId });
	}

	createClass(classData) {
		if (!classData) {
			throwError("Class Data is required", 422);
		}

		const newClass = new this.Class(classData);

		return newClass.save();
	}
}
