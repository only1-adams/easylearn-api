import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

const departmentSchema = new Schema(
	{
		faculty: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "faculty",
			index: true,
		},

		name: {
			type: String,
			required: true,
			index: true,
		},
	},
	{ timestamps: true }
);

departmentSchema.index({ faculty: 1, name: 1 }, { unique: true });

const DepartmentModel = dbConnection.model("department", departmentSchema);

export default DepartmentModel;
