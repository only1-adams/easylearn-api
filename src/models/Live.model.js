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

		producerId: {
			type: String,
			required: true,
			index: true,
		},
	},
	{ timestamps: true }
);

const LiveModel = dbConnection.model("live", liveSchema);

export default LiveModel;
