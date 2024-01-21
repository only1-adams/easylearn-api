import { throwError } from "../helpers/error-helpers.js";

export default class MessageService {
	constructor(MessageModel) {
		this.Message = MessageModel;
	}

	createMessage(data) {
		if (!data) {
			throwError("Message data required", 422);
		}

		const message = new this.Message(data);
		return message.save();
	}

	getClassMessages(classId) {
		if (!classId) {
			throwError("Class id required", 422);
		}

		return this.Message.find({ class: classId })
			.populate({
				path: "class",
			})
			.populate({ path: "sender" });
	}
}
