import { config } from "dotenv";
import {
	CreateMultipartUploadCommand,
	UploadPartCommand,
	CompleteMultipartUploadCommand,
	AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";

config();

export const initiateMultipartUpload = async function (key, s3Client) {
	const uploadParams = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
	};

	const createMultipartUploadCommand = new CreateMultipartUploadCommand(
		uploadParams
	);

	const multiUploadParams = await s3Client.send(createMultipartUploadCommand);

	return multiUploadParams;
};

export const uploadPart = async (
	chunk,
	partNumber,
	uploadId,
	key,
	s3Client
) => {
	try {
		const uploadPartParams = {
			Bucket: process.env.S3_BUCKET_NAME,
			Key: key,
			PartNumber: partNumber,
			UploadId: uploadId,
			Body: chunk,
		};

		console.log("initiating s3 upload", partNumber);

		const uploadPartCommand = new UploadPartCommand(uploadPartParams);

		const partParams = await s3Client.send(uploadPartCommand);

		console.log("done with s3 upload", partNumber);

		return partParams;
	} catch (error) {
		console.log(error, "inside upload");
	}
};

export const completeUpload = async (key, uploadId, parts, s3Client) => {
	const completeMultipartUploadParams = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
		UploadId: uploadId,
		MultipartUpload: { Parts: parts },
	};

	const completeMultipartUploadCommand = new CompleteMultipartUploadCommand(
		completeMultipartUploadParams
	);

	await s3Client.send(completeMultipartUploadCommand);

	console.log("S3 upload completed");

	return true;
};

export const abortUpload = async (key, uploadId) => {
	console.error("Error during S3 upload:", uploadError);

	// Abort the multipart upload on error
	const abortMultipartUploadParams = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
		UploadId: uploadId,
	};

	const abortMultipartUploadCommand = new AbortMultipartUploadCommand(
		abortMultipartUploadParams
	);

	await s3Client.send(abortMultipartUploadCommand);

	return true;
};
