export const throwError = (message, statusCode, errorList = undefined) => {
	const error = new Error(message);
	error.statusCode = statusCode;
	error.errorList = errorList;
	throw error;
};

export const nextError = (next, error) => {
	let jwtError = false;
	if (error.name) {
		jwtError =
			error.name === "TokenExpiredError" ||
			error.name === "JsonWebTokenError" ||
			error.name === "NotBeforeError";
	}

	if (jwtError) {
		error.statusCode = 401;
		error.message = "Unauthorized! Invalid or expired access token";
	}
	next(error);
};
