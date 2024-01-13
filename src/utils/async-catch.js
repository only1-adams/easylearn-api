import { nextError } from "../helpers/error-helpers.js";

const asyncCatch = function (fn) {
	return async (req, res, next) => {
		try {
			await fn(req, res, next);
		} catch (error) {
			nextError(next, error);
		}
	};
};

export default asyncCatch;
