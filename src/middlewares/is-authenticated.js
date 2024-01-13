import asyncCatch from "../utils/async-catch.js";
import { decodeAccessToken } from "../helpers/auth-helpers.js";
import { throwError } from "../helpers/error-helpers.js";
import AuthService from "../services/Auth.service.js";
import UserService from "../services/User.service.js";

const authService = new AuthService(UserService);

const isAuthenticated = asyncCatch(async (req, res, next) => {
	const token = req.headers.authorization.split(" ")[1];

	const payload = decodeAccessToken(token);

	const userDetails = await authService.getUserDetails(payload.userId);

	if (!userDetails) {
		throwError("Unauthorized! Invalid or expired token", 401);
	}

	req.user = userDetails;

	next();
});

export default isAuthenticated;
