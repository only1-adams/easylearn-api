import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

const liveSchema = new Schema(
	{
		class: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "class",
			index: true,
		},

		producers: {
			type: [String],
			max: 2,
			required: true,
		},
	},
	{ timestamps: true }
);

const LiveModel = dbConnection.model("live", liveSchema);

export default LiveModel;
