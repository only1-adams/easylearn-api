import { validationResult, matchedData } from "express-validator";
import { throwError } from "../helpers/error-helpers.js";

const validateRequestBody = (req) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		throwError("Validation Failed!", 422, errors.array());
	}

	return matchedData(req);
};

export default validateRequestBody;
