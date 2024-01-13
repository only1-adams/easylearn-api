import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

const facultySchema = new Schema(
	{
		university: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "university",
			index: true,
		},

		name: {
			type: String,
			required: true,
			index: true,
		},

		facultyEmail: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

facultySchema.index({ university: 1, name: 1 }, { unique: true });

const FacultyModel = dbConnection.model("faculty", facultySchema);

export default FacultyModel;
