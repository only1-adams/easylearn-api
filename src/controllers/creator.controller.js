import asyncCatch from "../utils/async-catch.js";
import validateRequestBody from "../utils/validate-request-body.js";
import UniversityService from "../services/University.service.js";
import UniversityModel from "../models/University.model.js";
import FacultyModel from "../models/Faculty.model.js";
import DepartmentModel from "../models/Department.model.js";
import CreatorService from "../services/Creator.service.js";
import CreatorModel from "../models/Creator.model.js";
import ClassModel from "../models/Class.model.js";
import UserService from "../services/User.service.js";
import AuthService from "../services/Auth.service.js";
import UserModel from "../models/User.model.js";
import { throwError } from "../helpers/error-helpers.js";
import generateCreatorEmail from "../utils/generate-creator-email.js";
import ShortUniqueId from "short-unique-id";
import { hashPassword } from "../helpers/auth-helpers.js";

const universityService = new UniversityService(
	UniversityModel,
	FacultyModel,
	DepartmentModel
);

const creatorService = new CreatorService(CreatorModel, ClassModel);

const userService = new UserService(UserModel);

const authService = new AuthService(UserService);

export const creatorApplication = asyncCatch(async (req, res) => {
	const { department, level } = validateRequestBody(req);

	const existingCreator = await creatorService.findCreatorByDepartmentAndLevel(
		department,
		level
	);

	if (existingCreator) {
		throwError(
			"A creator for your department has already been created. Please log in",
			400
		);
	}

	const departmentDetails = await universityService.getDepartmentByID(
		department
	);

	const universityAcronym = departmentDetails.faculty.university.acronym;
	const faculty = departmentDetails.faculty.name;
	const departmentName = departmentDetails.name;

	const creatorEmail = generateCreatorEmail(
		universityAcronym,
		faculty,
		departmentName,
		level
	);

	const uid = new ShortUniqueId({ length: 10 });
	const creatorPassword = uid.rnd();
	const hashedCreatorPassword = await hashPassword(creatorPassword);

	const user = await userService.createUser({
		email: creatorEmail,
		password: hashedCreatorPassword,
		role: "creator",
	}); // create user document for creator

	await creatorService.createCreator({
		user: user._id,
		department: departmentDetails._id,
		level,
	}); // create creator profile linked to the user

	res.status(200).json({
		message: "Creator account has been created",
		creator: { email: creatorEmail, password: creatorPassword },
	});
});

export const creatorSignin = asyncCatch(async (req, res) => {
	const data = validateRequestBody(req);

	const token = await authService.creatorSignin(data);

	res.status(200).json({ message: "Signed in successfully", token: token });
});

export const createClass = asyncCatch(async (req, res) => {
	const data = validateRequestBody(req);

	const newClass = await creatorService.createClass(data);

	res.status(200).json({ class: newClass });
});

export const getCreatorDetails = asyncCatch(async (req, res) => {
	const user = req.user;

	const creator = await creatorService.findCreatorByUserId(user._id);

	res.status(200).json({ creator: creator });
});
