import mongoose from "mongoose";
import { config } from "dotenv";

config();

const dbConnection = mongoose.createConnection(process.env.DB_CONNECTION_URI, {
	maxPoolSize: 10,
	socketTimeoutMS: 45000,
});

export default dbConnection;
