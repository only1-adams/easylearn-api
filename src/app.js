import { config } from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import AuthRoutes from "./routes/Auth.route.js";
import UniversityRoutes from "./routes/University.route.js";
import StudentRoutes from "./routes/Student.route.js";
import CreatorRoutes from "./routes/Creator.route.js";

config();

const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(
	cors({
		origin: process.env.CLIENT_BASE_URL,
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

app.use("/auth", AuthRoutes);
app.use("/university", UniversityRoutes);
app.use("/student", StudentRoutes);
app.use("/creator", CreatorRoutes);

app.use((err, req, res, next) => {
	const statusCode = err.statusCode || 500;
	const message = err.message;
	const errorList = err.errorList || [];

	res.status(statusCode).json({ message, errors: errorList });
});

export default app;
