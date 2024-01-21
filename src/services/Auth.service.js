import { throwError } from "../helpers/error-helpers.js";
import {
	hashPassword,
	comparePassword,
	generateAccessToken,
} from "../helpers/auth-helpers.js";
import User from "../models/User.model.js";
import ShortUniqueId from "short-unique-id";
import activationMailQueue from "../queues/mail.queue.js";

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

		const activationCodeUID = new ShortUniqueId({
			length: 4,
			dictionary: "number",
		});

		const activationCode = activationCodeUID.rnd();

		const hashedCode = await hashPassword(activationCode);

		const user = await this.UserService.createUser({
			email,
			password: hashedPassword,
			role,
			activationCode: hashedCode,
		});

		await activationMailQueue.add(
			user._id,
			{
				email,
				activationCode: activationCode,
			},
			{ lifo: true, removeOnComplete: true, removeOnFail: true }
		);

		return { email: user.email, role: user.role };
	}

	async activateAccount(code, userId) {
		const user = await this.UserService.findUserByID(userId);

		try {
			await comparePassword(code, user.activationCode);
		} catch (error) {
			throwError("Invalid activation code", 422);
			return;
		}

		user.activated = true;

		await user.save();
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
