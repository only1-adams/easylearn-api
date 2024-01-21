import mongoose from "mongoose";
import dbConnection from "../../db-connection.js";

const { Schema } = mongoose;

const userSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			index: true,
			unique: true,
		},

		password: {
			type: String,
			required: true,
		},

		role: {
			type: String,
			enum: ["admin", "student", "creator"],
			required: true,
		},

		activated: {
			type: Boolean,
			required: true,
			default: false,
		},

		activationCode: String,
	},
	{ timestamps: true }
);

const UserModel = dbConnection.model("user", userSchema);

export default UserModel;
