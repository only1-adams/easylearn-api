import { throwError } from "../helpers/error-helpers.js";

class UserService {
	constructor(UserModel) {
		this.User = UserModel;
	}

	createUser(userDetails) {
		if (!userDetails) {
			throwError("User details required!", 422);
		}

		const user = new this.User(userDetails);

		return user.save();
	}

	findUserByEmail(email) {
		if (!email) {
			throwError("Email required!", 422);
		}
		const query = this.User.findOne({ email: email });
		
		return {
			exec: () => query.exec(),
			select: (fields) => query.select(fields),
		};
	}

	findUserByID(userId) {
		if (!userId) {
			throwError("User ID required!", 422);
		}

		return this.User.findById(userId).select("-password");
	}
}

export default UserService;
