import { throwError } from "../helpers/error-helpers.js";
import {
	hashPassword,
	comparePassword,
	generateAccessToken,
} from "../helpers/auth-helpers.js";
import User from "../models/User.model.js";

export default class AuthService {
	constructor(UserService) {
		this.UserService = new UserService(User);
	}

	async signup(signupDetails) {
		if (!signupDetails) {
			throwError("Please provide the details", 422);
		}

		const { email, password, role } = signupDetails;

		const existingUser = await this.UserService.findUserByEmail(email).exec();

		if (existingUser) {
			throwError("Account already exists, please log in", 401);
		}

		const hashedPassword = await hashPassword(password);

		const user = await this.UserService.createUser({
			email,
			password: hashedPassword,
			role,
		});

		return { email: user.email, role: user.role };
	}

	async signin(signDetails) {
		if (!signDetails) {
			throwError("Signin Details required", 422);
		}

		const { email, password } = signDetails;

		const user = await this.UserService.findUserByEmail(email).exec();

		if (!user) {
			await comparePassword("fake-password", "repeated-password");
		}

		await comparePassword(password, user.password);

		const token = generateAccessToken({ userId: user._id, role: user.role });

		return token;
	}

	async creatorSignin(details) {
		if (!details) {
			throwError("Signin Details required", 422);
		}

		const { email, password } = details;

		const user = await this.UserService.findUserByEmail(email).exec();

		if (!user) {
			await comparePassword("fake-password", "repeated-password");
		}

		if (user.role !== "creator") {
			await comparePassword("fake-password", "repeated-password");
		}

		await comparePassword(password, user.password);

		const token = generateAccessToken({ userId: user._id, role: user.role });

		return token;
	}

	async getUserDetails(userId) {
		if (!userId) {
			throwError("User id is required", 422);
		}

		const user = await this.UserService.findUserByID(userId);

		return user;
	}
}
