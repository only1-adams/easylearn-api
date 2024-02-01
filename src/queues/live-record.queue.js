import { config } from "dotenv";
import {
	UploadPartCommand,
	CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import CreatorService from "../services/Creator.service.js";
import CreatorModel from "../models/Creator.model.js";
import ClassModel from "../models/Class.model.js";
import AttendanceModel from "../models/Attendance.model.js";

config();

const creatorService = new CreatorService(
	CreatorModel,
	ClassModel,
	AttendanceModel
);

class recordedVideoUploader {
	constructor(uploadId, classId, s3Client) {
		this.uploadId = uploadId;
		this.s3Client = s3Client;
		this.classId = classId;
		this.uploadedParts = new Map();
	}

	async storeBuffer(partNumber, buffer, key) {
		try {
			const params = await this.s3UploadPart(partNumber, buffer, key);
			this.uploadedParts.set(partNumber, {
				ETag: params.ETag,
				PartNumber: partNumber,
			});
		} catch (error) {
			this.storeBuffer(partNumber, buffer, key);
		}
	}

	async s3UploadPart(partNumber, buffer, key) {
		const uploadPartParams = {
			Bucket: process.env.S3_BUCKET_NAME,
			Key: key,
			PartNumber: partNumber,
			UploadId: this.uploadId,
			Body: buffer,
		};

		console.log("initiating s3 upload", partNumber);

		const uploadPartCommand = new UploadPartCommand(uploadPartParams);

		const partParams = await this.s3Client.send(uploadPartCommand);

		console.log("done with s3 upload", partNumber);

		return partParams;
	}

	async s3CompleteUpload(key, parts) {
		console.log(key, parts, "complete");
		const completeMultipartUploadParams = {
			Bucket: process.env.S3_BUCKET_NAME,
			Key: key,
			UploadId: this.uploadId,
			MultipartUpload: { Parts: parts },
		};

		const completeMultipartUploadCommand = new CompleteMultipartUploadCommand(
			completeMultipartUploadParams
		);

		await this.s3Client.send(completeMultipartUploadCommand);

		console.log("S3 upload completed");

		return true;
	}

	async complete(totalUploadsMade, key) {
		const checkCompletion = async () => {
			if (totalUploadsMade === this.uploadedParts.size) {
				await this.s3CompleteUpload(
					key,
					Array.from(this.uploadedParts.values())
				);
				this.uploadedParts.clear();
				await creatorService.updateClass(this.classId, { recordUrl: key });
				return true;
			} else {
				// Retry after a delay
				setTimeout(checkCompletion, 1000); // Adjust the delay as needed
			}
		};

		await checkCompletion();

		return true;
	}
}

export default recordedVideoUploader;
