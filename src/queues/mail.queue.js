import { config } from "dotenv";
import { Queue, Worker } from "bullmq";
import sgMail from "@sendgrid/mail";
import {
	generateActivationEmail,
	generateProfileUpdateEmail,
} from "../helpers/mail.js";
import redisConnectionConfig from "../../redis-connection.js";

config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const connection = redisConnectionConfig;

const activationMailQueue = new Queue("activationMail", {
	connection: { ...connection.socket, password: connection.password },
	defaultJobOptions: {
		removeOnComplete: true,
		removeOnFail: true,
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 1000,
		},
	},
});

export const activationMailWorker = new Worker(
	"activationMail",
	async (job) => {
		console.log("Processing");
		const { action } = job.data;
		const subject =
			action === "activation"
				? "Action Required: Activate your Easylearn account"
				: action === "email"
				? "Action Required: Request to change email"
				: action === "password"
				? "Action Required: Request to Change Password"
				: "";

		const msg = {
			to: job.data.email,
			from: "adams.muhammed@arazara.com.ng", // Use the email address or domain you verified above
			subject: subject,
			html:
				action === "activation"
					? generateActivationEmail(job.data.activationCode)
					: generateProfileUpdateEmail(job.data.activationCode, action),
		};

		try {
			await sgMail.send(msg);
		} catch (error) {
			console.log(error);
			throw new Error();
		}

		return "ok";
	},
	{
		autorun: false,
		connection: { ...connection.socket, password: connection.password },
		removeOnComplete: true,
		removeOnFail: true,
	}
);

export default activationMailQueue;
