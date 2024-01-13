import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

const universitySchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			index: true,
			unique: true,
		},

		acronym: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{ timestamps: true }
);

universitySchema.index({ name: 1, acronym: 1 }, { unique: true });

const UniversityModel = dbConnection.model("university", universitySchema);

export default UniversityModel;
