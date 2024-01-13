import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

const creatorSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "user",
		},

		department: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "department",
			index: true,
		},

		level: {
			type: Number,
			min: 100,
			max: 900,
			required: true,
			index: true,
		},
	},
	{ timestamps: true }
);

creatorSchema.index({ department: 1, level: 1 }, { unique: true });

const CreatorModel = dbConnection.model("creator", creatorSchema);

export default CreatorModel;
