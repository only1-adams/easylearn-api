import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema(
	{
		class: {
			type: Schema.Types.ObjectId,
			ref: "class",
			required: true,
		},

		message: {
			type: String,
			required: true,
		},

		sender: {
			type: Schema.Types.ObjectId,
			ref: function () {
				return this.senderType === "student" ? "student" : "creator";
			},
			required: true,
		},

		senderType: {
			type: String,
			required: true,
			enum: ["student", "creator"],
		},
	},
	{ timestamps: true }
);

messageSchema.post("save", (doc, next) => {
	doc.populate("class sender").then(() => {
		next();
	});
});

const MessageModel = dbConnection.model("message", messageSchema);

export default MessageModel;
