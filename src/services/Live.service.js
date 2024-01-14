import { throwError } from "../helpers/error-helpers.js";

export default class LiveService {
	constructor(LiveModel, ClassModel) {
		this.Live = LiveModel;
		this.Class = ClassModel;
	}

	createLive(data) {
		if (!data) {
			throwError("Live data is required", 422);
		}

		const newLive = new this.Live(data);

		return newLive.save();
	}

	getClassLive(classId) {
		if (!classId) {
			throwError("class id is required", 422);
		}

		return this.Live.findOne({ class: classId });
	}

	deleteLiveClass(classId) {
		if (!classId) {
			throwError("class id is required", 422);
		}
		return this.Live.findOneAndDelete({ class: classId });
	}
}
