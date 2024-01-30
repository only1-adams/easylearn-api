import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

export const classSchema = new Schema(
	{
		creator: {
			type: Schema.Types.ObjectId,
			ref: "creator",
			required: true,
			index: true,
		},

		courseTitle: {
			type: String,
			required: true,
		},

		courseCode: {
			type: String,
			required: true,
		},

		lecturerName: {
			type: String,
			required: true,
		},

		status: {
			type: String,
			enum: ["ongoing", "finished"],
			required: true,
			default: "ongoing",
		},

		recordUrl: {
			type: String,
			index: true,
		},
	},
	{ timestamps: true }
);

const ClassModel = dbConnection.model("class", classSchema);

export default ClassModel;
