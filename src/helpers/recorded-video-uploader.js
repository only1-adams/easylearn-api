import { config } from "dotenv";
import { fork } from "node:child_process";
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
		this.classId = classId;

		this.s3Client = s3Client;
		this.uploadedParts = new Map(); // parts that were uploaded successfully

		this.uploadProcess = fork("./src/processes/recorded-video-process");
		this.uploadProcessHandler();
	}

	// 	export NVM_DIR="$HOME/.nvm"
	// [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
	// [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

	uploadProcessHandler() {
		this.uploadProcess.on("message", (message) => {
			if (message.type === "upload-complete") {
				const { PartNumber, ETag } = message;
				this.uploadedParts.set(PartNumber, { PartNumber, ETag });
			}

			if (message.type === "multipart-success") {
				(async () => {
					const { key } = message;
					await creatorService.updateClass(this.classId, { recordUrl: key });
					this.uploadProcess.kill();
				})();
			}
		});
	}

	async initiateUpload(partNumber, buffer, key) {
		this.uploadProcess.send({
			type: "upload-buffer",
			buffer: buffer.toString("base64"),
			key,
			partNumber,
			uploadId: this.uploadId,
		});
	}

	async complete(totalUploadsMade, key) {
		const checkCompletion = async () => {
			const allPartsUploaded = totalUploadsMade === this.uploadedParts.size; // check if all parts have been uploaded

			if (allPartsUploaded) {
				const sortedParts = Array.from(this.uploadedParts.values()).sort(
					(a, b) => a.PartNumber - b.PartNumber
				);

				this.uploadProcess.send({
					type: "complete-multipart",
					key,
					parts: sortedParts,
					uploadId: this.uploadId,
				});

				this.uploadedParts.clear();
				return true;
			} else {
				setTimeout(checkCompletion, 1000);
			}
		};

		await checkCompletion();

		return true;
	}
}

export default recordedVideoUploader;
