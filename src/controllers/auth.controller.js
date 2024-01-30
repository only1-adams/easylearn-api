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

export const activateAccount = asyncCatch(async (req, res) => {
	const user = req.user;
	const { activationCode } = validateRequestBody(req);

	await authService.activateAccount(activationCode, user._id);

	res.status(200).json({ message: "Account activated successfully" });
});

export const resendActivationCode = asyncCatch(async (req, res) => {
	const user = req.user;

	await authService.resendActivationCode(user._id);

	res.status(200).json({ message: "Activation code sent" });
});

export const requestEmailChange = asyncCatch(async (req, res) => {
	const user = req.user;
	const { newEmail } = validateRequestBody(req);

	console.log(newEmail);

	await authService.changeEmail(user._id, newEmail);

	res.status(200).json({ message: "Request Initiated" });
});

export const requestPasswordChange = asyncCatch(async (req, res) => {
	const user = req.user;

	await authService.changePassword(user._id);

	res.status(200).json({ message: "Request Initiated" });
});

export const verifyEmailChange = asyncCatch(async (req, res) => {
	const user = req.user;
	const { code, newEmail } = validateRequestBody(req);

	await authService.verifyEmailChange(user._id, code, newEmail);

	res.status(200).json({ message: "Email Changed" });
});

export const verifyPasswordChange = asyncCatch(async (req, res) => {
	const user = req.user;
	const { code, newPassword } = validateRequestBody(req);

	await authService.verifyPasswordChange(user._id, code, newPassword);

	res.status(200).json({ message: "Password Changed" });
});
