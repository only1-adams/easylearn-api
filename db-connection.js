import mongoose from "mongoose";

const dbConnection = mongoose.createConnection(
	"mongodb://localhost:27017/easylearn",
	{
		maxPoolSize: 10,
		socketTimeoutMS: 45000,
	}
);

export default dbConnection;
