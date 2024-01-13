import asyncCatch from "../utils/async-catch.js";
import validateRequestBody from "../utils/validate-request-body.js";
import AuthService from "../services/Auth.service.js";
import UserService from "../services/User.service.js";

const authService = new AuthService(UserService);

export const signUserIn = asyncCatch(async (req, res, next) => {
	const data = validateRequestBody(req);

	const token = await authService.signin(data);

	res.status(200).json({ message: "Signed in successfully", token: token });
});

export const signUserUp = asyncCatch(async (req, res) => {
	const data = validateRequestBody(req);

	const user = await authService.signup(data);

	res.status(200).json({ message: "Signed up successfully", user: user });
});

export const getUserDetails = asyncCatch(async (req, res) => {
	res.status(200).json({ user: req.user });
});
