import dbConnection from "../../db-connection.js";
import mongoose from "mongoose";

const { Schema } = mongoose;

const starredClassSchema = new Schema({
	student: {
		type: Schema.Types.ObjectId,
		required: true,
		index: true,
		ref: "student",
	},

	class: {
		type: Schema.Types.ObjectId,
		required: true,
		index: true,
		ref: "class",
	},
});

const StarredClassModel = dbConnection.model("starred", starredClassSchema);

export default StarredClassModel;
