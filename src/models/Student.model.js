import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

const studentSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "user",
			index: true,
		},

		department: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "department",
			index: true,
		},

		matricNo: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},

		level: {
			type: Number,
			min: 100,
			max: 900,
			required: true,
		},

		fullName: {
			type: String,
			required: true,
		},

		expelled: {
			type: Boolean,
			required: true,
			default: false,
		},

		profilePicture: {
			type: String,
		},
	},
	{ timestamps: true }
);

studentSchema.post("save", (doc, next) => {
	doc.populate("department").then(() => {
		next();
	});
});

const StudentModel = dbConnection.model("student", studentSchema);

export default StudentModel;
