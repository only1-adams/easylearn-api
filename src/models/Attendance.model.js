import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

const attendanceSchema = new Schema(
	{
		class: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
			ref: "class",
		},
		student: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
			ref: "student",
		},
	},
	{ timestamps: true }
);

attendanceSchema.index({ class: 1, student: 1 }, { unique: true });

const AttendanceModel = dbConnection.model("attendance", attendanceSchema);

export default AttendanceModel;
