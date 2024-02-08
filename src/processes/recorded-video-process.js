import { config } from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";
import {
	UploadPartCommand,
	CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";

config();

const s3Client = new S3Client({ region: "us-east-1", forcePathStyle: true });

async function s3UploadPart(partNumber, buffer, key, uploadId) {
	const uploadPartParams = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
		PartNumber: partNumber,
		UploadId: uploadId,
		Body: buffer,
	};

	const uploadPartCommand = new UploadPartCommand(uploadPartParams);

	const partParams = await s3Client.send(uploadPartCommand);

	return partParams;
}

async function s3CompleteUpload(key, parts, uploadId) {
	console.log(key, parts, "complete");
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
}

process.on("message", (msg) => {
	if (msg.type === "upload-buffer") {
		(async () => {
			async function upload() {
				const { partNumber, key, uploadId } = msg;
				try {
					console.log("starting s3 upload for part", partNumber);

					const buffer = Buffer.from(msg.buffer, "base64");
					const params = await s3UploadPart(partNumber, buffer, key, uploadId);

					console.log("Done with s3 upload for part:", partNumber);
					process.send({
						type: "upload-complete",
						PartNumber: partNumber,
						ETag: params.ETag,
					});
					return;
				} catch (error) {
					console.log(
						error,
						"s3 error in child process- partnumber:",
						partNumber
					);
					setTimeout(upload, 1000);
				}
			}

			await upload();
			return;
		})();
	}

	if (msg.type === "complete-multipart") {
		(async () => {
			async function completeMultipartUpload() {
				const { key, parts, uploadId } = msg;
				try {
					await s3CompleteUpload(key, parts, uploadId);
					process.send({ type: "multipart-success", key });
					console.log("Done with completing multipart upload");
				} catch (error) {
					console.log(
						error,
						"s3 error while completing in child process- uploadId:",
						uploadId
					);
					setTimeout(completeMultipartUpload, 1000);
				}
			}

			await completeMultipartUpload();
			return true;
		})();
	}
});
