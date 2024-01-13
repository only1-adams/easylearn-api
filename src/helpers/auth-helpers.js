import { throwError } from "./error-helpers.js";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";

const { sign, verify } = jwt;

export const verifyUserExists = (req) => {
	if (!req.user) {
		throwError("Unauthorized!", 401);
	}
};

export const hashPassword = async (rawPassword) => {
	const saltRounds = 12;
	const hashedPassword = await hash(rawPassword, saltRounds);
	return hashedPassword;
};

export const comparePassword = async (rawPassword, hashedPassword) => {
	const passwordIsValid = await compare(rawPassword, hashedPassword);

	if (!passwordIsValid) {
		throwError("Invalid email or password", 401);
	}
};

export const generateAccessToken = (payload) => {
	const token = sign(payload, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	return token;
};

export const decodeAccessToken = (token) => {
	const decoded = verify(token, process.env.JWT_SECRET);
	return decoded;
};
