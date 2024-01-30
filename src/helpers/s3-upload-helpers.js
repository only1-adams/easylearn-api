import { config } from "dotenv";
import {
	S3Client,
	CreateMultipartUploadCommand,
	UploadPartCommand,
	CompleteMultipartUploadCommand,
	AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";

config();

const s3Client = new S3Client({ region: "us-east-1", forcePathStyle: true });

export const initiateMultipartUpload = async function (key) {
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

export const uploadPart = async (chunk, partNumber, uploadId, key) => {
	const uploadPartParams = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
		PartNumber: partNumber,
		UploadId: uploadId,
		Body: chunk,
	};

	const uploadPartCommand = new UploadPartCommand(uploadPartParams);

	const partParams = await s3Client.send(uploadPartCommand);

	console.log(partParams, chunk.length, "uppPart");

	return partParams;
};

export const completeUpload = async (key, uploadId, parts) => {
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
