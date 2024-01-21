import { config } from "dotenv";
import { Queue, Worker } from "bullmq";
import sgMail from "@sendgrid/mail";
import { generateActivationEmail } from "../helpers/mail.js";
import redisConnectionConfig from "../../redis-connection.js";

config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const connection = redisConnectionConfig;

const activationMailQueue = new Queue("activationMail", {
	connection: { ...connection.socket, password: connection.password },
	defaultJobOptions: {
		removeOnComplete: true,
		removeOnFail: true,
	},
});

export const activationMailWorker = new Worker(
	"activationMail",
	async (job) => {
		const msg = {
			to: job.data.email,
			from: "adams.muhammed@arazara.com.ng", // Use the email address or domain you verified above
			subject: "Action Required: Activate your Easylearn account",
			html: generateActivationEmail(job.data.activationCode),
		};

		try {
			await sgMail.send(msg);
		} catch (error) {
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
