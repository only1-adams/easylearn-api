import { config } from "dotenv";
import Ffmpeg from "fluent-ffmpeg";
import { createSdpText, convertStringToStream } from "./live-record-helpers.js";
import { Writable } from "stream";
import { initiateMultipartUpload } from "./s3-upload-helpers.js";
import { S3Client } from "@aws-sdk/client-s3";
import recordedVideoUploader from "../queues/live-record.queue.js";

config();

const s3Client = new S3Client({ region: "us-east-1", forcePathStyle: true });

class FFmpeg {
	constructor(rtpParameters, classId) {
		this.rtpParameters = rtpParameters;
		this.classId = classId;
		this.process = null; // To keep track of the FFmpeg process
		this.uploadId = null; // To store the ID of the multipart upload
		this.accumulatedChunks = [];
		this.partNumber = 0;
		this.TARGET_SIZE = 5 * 1024 * 1024; // Mb of chunks per s3 upload

		this.Writable = new Writable({
			highWaterMark: 50 * 1024 * 1024,
			write: (chunk, encoding, callback) => {
				const instance = this;
				this.processChunk(chunk, encoding, callback, instance);
			},
		});

		this._createProcess();
	}

	async _createProcess() {
		const sdpString = createSdpText(this.rtpParameters);
		const sdpStream = convertStringToStream(sdpString);

		console.log("createProcess() [sdpString:%s]", sdpString);

		//inject stream into ffmpeg

		this.process = Ffmpeg()
			.input(sdpStream)
			.inputFormat("sdp")
			.inputOptions(["-protocol_whitelist", "pipe,udp,rtp"])
			.videoCodec("copy")
			.audioCodec("copy")
			.outputFormat("webm")
			.on("start", async () => {
				const response = await initiateMultipartUpload(
					`record-${this.classId}.webm`,
					s3Client
				); // prepare to upload to S3

				this.uploadId = response.UploadId;

				this.uploader = new recordedVideoUploader(
					response.UploadId,
					this.classId,
					s3Client
				);

				console.log("Multipart upload initiated. Upload ID:", this.uploadId);
			})
			.on("error", async (err, stdout, stderr) => {
				console.error("Error:", err);
				console.error("ffmpeg::process::stdout", stdout);
				console.error("ffmpeg::process::stderr", stderr);
			})
			.pipe(this.Writable, { end: true }); // pipe output to writable stream
	}

	async processChunk(chunk, encoding, callback, instance) {
		try {
			instance.accumulatedChunks.push(chunk);
			const buffer = Buffer.concat(instance.accumulatedChunks);
			const bufferSize = buffer.length;
			console.log(bufferSize);

			if (bufferSize >= instance.TARGET_SIZE) {
				console.log(bufferSize, "in");
				instance.partNumber += 1;

				instance.uploader.storeBuffer(
					instance.partNumber,
					buffer,
					`record-${instance.classId}.webm`
				);

				instance.accumulatedChunks.length = 0;
			}

			callback();
		} catch (error) {
			callback(error);
		}
	}

	async kill() {
		console.log("kill()");
		if (!this.process) {
			return;
		}

		console.log("end");

		if (this.accumulatedChunks.length > 0) {
			this.partNumber += 1;
			const buffer = Buffer.concat(this.accumulatedChunks);
			this.uploader.storeBuffer(
				this.partNumber,
				buffer,
				`record-${this.classId}.webm`
			);
		}

		await this.uploader.complete(
			this.partNumber,
			`record-${this.classId}.webm`
		);

		this.process.end();
		this.Writable.end();
	}
}

export default FFmpeg;
