import { config } from "dotenv";
import { Queue, Worker, QueueEvents } from "bullmq";
import redisConnectionConfig from "../../redis-connection.js";
import { completeUpload, uploadPart } from "../helpers/s3-upload-helpers.js";
import { classSchema } from "../models/Class.model.js";
import CreatorService from "../services/Creator.service.js";
import mongoose from "mongoose";

config();

const connection = redisConnectionConfig;

export const jobBuffers = new Map();
export const parts = new Map();
export const toBeCompleted = new Map();

const recordQueue = new Queue("liveRecord", {
	connection: { ...connection.socket, password: connection.password },
	defaultJobOptions: {
		removeOnComplete: true,
		removeOnFail: true,
		attempts: 5,
		backoff: {
			type: "exponential",
			delay: 1000,
		},
	},
});

export const recordQueueEvents = new QueueEvents("liveRecord", {
	connection: { ...connection.socket, password: connection.password },
	autorun: true,
});

recordQueueEvents.on("completed", async ({ jobId, returnvalue }) => {
	if (returnvalue?.partdata) {
		const {
			type,
			partdata: { partNumber },
			uploadId,
		} = returnvalue;

		const uploadIdParts = parts.get(uploadId);
		const completeUploadData = toBeCompleted.get(uploadId);

		if (
			type === "uploadPart" &&
			completeUploadData &&
			partNumber === completeUploadData.totalUploads - 1
		) {
			await completeUpload(completeUploadData.key, uploadId, uploadIdParts);
			console.log("completed");
			const dbConnection = mongoose.createConnection(
				process.env.DB_CONNECTION_URI,
				{
					maxPoolSize: 10,
					socketTimeoutMS: 45000,
				}
			);

			const ClassModel = dbConnection.model("class", classSchema);

			dbConnection.once("open", async () => {
				const classService = new CreatorService({}, ClassModel);
				await classService.updateClass(completeUploadData.classId, {
					recordUrl: completeUploadData.key,
				});
			});
		}
	}
});

export const recordWorker = new Worker(
	"liveRecord",
	async (job) => {
		const { type, partNumber } = job.data;

		console.log("executing upload", type, partNumber);

		if (type === "uploadPart") {
			try {
				const result = await uploadPartHandler(job);
				return result;
			} catch (error) {
				console.log("error:part", error);
			}
		}

		if (type === "uploadComplete") {
			try {
				const result = await uploadCompleteHandler(job);
				return result;
			} catch (error) {
				console.log("error:complete", error);
			}
		}
	},
	{
		autorun: false,
		connection: { ...connection.socket, password: connection.password },
		removeOnComplete: true,
		removeOnFail: true,
	}
);

async function uploadPartHandler(job) {
	const { uploadId, partNumber, key, type } = job.data;

	const buffer = jobBuffers.get(`${key.split("-")[1]}${partNumber}`);

	const uploadData = await uploadPart(
		buffer,
		partNumber,
		uploadId,
		`${key}.webm`
	);

	console.log(`done uploading part ${partNumber}`);

	const partdata = {
		PartNumber: partNumber,
		ETag: uploadData.ETag,
	};

	const uploadIdParts = parts.get(uploadId);
	if (!uploadIdParts) {
		parts.set(uploadId, [partdata]);
	} else {
		uploadIdParts.push(partdata);
	}

	jobBuffers.delete(`${key.split("-")[1]}${partNumber}`);

	return { partdata, type, uploadId };
}

async function uploadCompleteHandler(job) {
	const { uploadId, key, totalUploads, type, classId } = job.data;

	const uploadIdParts = parts.get(uploadId);

	console.log(
		"df",
		uploadId,
		JSON.stringify(uploadIdParts),
		uploadIdParts?.length,
		totalUploads
	);

	let result;

	if (uploadIdParts && uploadIdParts.length === totalUploads - 1) {
		result = await completeUpload(key, uploadId, uploadIdParts);
		console.log("completed:STRAIGHT");

		const dbConnection = mongoose.createConnection(
			process.env.DB_CONNECTION_URI,
			{
				maxPoolSize: 10,
				socketTimeoutMS: 45000,
			}
		);

		const ClassModel = dbConnection.model("class", classSchema);
		dbConnection.once("open", async () => {
			const classService = new CreatorService({}, ClassModel);
			await classService.updateClass(classId, { recordUrl: key });
		});
	} else {
		toBeCompleted.set(uploadId, { key, totalUploads, classId });
	}

	return { totalUploads, type, result };
}

export default recordQueue;
