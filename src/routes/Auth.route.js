import express from "express";
import { body } from "express-validator";
import {
	signUserIn,
	signUserUp,
	getUserDetails,
	activateAccount,
	requestEmailChange,
	resendActivationCode,
	requestPasswordChange,
	verifyEmailChange,
	verifyPasswordChange,
} from "../controllers/auth.controller.js";
import isAuthenticated from "../middlewares/is-authenticated.js";

const router = express.Router();

router.post(
	"/signin",
	[
		body("email")
			.trim()
			.notEmpty()
			.withMessage("Email required")
			.isEmail()
			.withMessage("Provide a valid email"),
		body("password").trim().notEmpty().withMessage("Password required"),
	],
	signUserIn
);

router.post(
	"/signup",
	[
		body("email")
			.trim()
			.notEmpty()
			.withMessage("Email required")
			.isEmail()
			.withMessage("Provide a valid email"),
		body("password")
			.trim()
			.notEmpty()
			.withMessage("Password required")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters")
			.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!_@#\$%\^&\*])(?=\S{8,})/, "i")
			.withMessage(
				"Password must contain at least one lowercase letter, one uppercase letter and one special character"
			),
		body("role").trim().notEmpty().withMessage("Role required"),
	],
	signUserUp
);

router.get("/me", isAuthenticated, getUserDetails);

router.post(
	"/activate",
	[body("activationCode").exists().isNumeric().isLength({ max: 4 })],
	isAuthenticated,
	activateAccount
);

router.post("/activate/resend", isAuthenticated, resendActivationCode);

router.post(
	"/changeemail",
	[body("newEmail").exists().notEmpty().isString().isEmail()],
	isAuthenticated,
	requestEmailChange
);

router.post("/changepassword", isAuthenticated, requestPasswordChange);

router.post(
	"/changeemail/verify",
	[
		body("code").exists().isNumeric().isLength({ max: 4 }),
		body("newEmail").exists().notEmpty().isString().isEmail(),
	],
	isAuthenticated,
	verifyEmailChange
);

router.post(
	"/changepassword/verify",
	[
		body("code").exists().isNumeric().isLength({ max: 4 }),
		body("newPassword")
			.exists()
			.notEmpty()
			.trim()
			.notEmpty()
			.withMessage("Password required")
			.isLength({ min: 8 })
			.withMessage("Password must be at least 8 characters")
			.matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!_@#\$%\^&\*])(?=\S{8,})/, "i")
			.withMessage(
				"Password must contain at least one lowercase letter, one uppercase letter and one special character"
			),
	],
	isAuthenticated,
	verifyPasswordChange
);

const AuthRoutes = router;

export default AuthRoutes;
