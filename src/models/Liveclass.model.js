import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

const liveClassSchema = new Schema({
	class: {
		type: SchemaType.Types.ObjectId,
		required: true,
		index: true,
	},

	producer: {
		type: String,
		required: true,
	},
});

const LiveclassModel = dbConnection.model("liveclass", liveClassSchema);

export default LiveclassModel;
