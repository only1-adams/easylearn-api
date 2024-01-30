import { config } from "dotenv";
import Ffmpeg from "fluent-ffmpeg";
import { createSdpText, convertStringToStream } from "./live-record-helpers.js";
import { EventEmitter } from "events";
import { Writable } from "stream";
import recordQueue from "../queues/live-record.queue.js";
import { initiateMultipartUpload } from "./s3-upload-helpers.js";
import { jobBuffers } from "../queues/live-record.queue.js";

config();

class FFmpeg {
	constructor(rtpParameters, classId) {
		this.rtpParameters = rtpParameters;
		this.classId = classId;
		this.process = null; // To keep track of the FFmpeg process
		this.uploadId = null; // To store the ID of the multipart upload
		this.accumulatedChunks = [];
		this.TARGET_SIZE = 5 * 1024 * 1024;
		this.Writable = new Writable({
			highWaterMark: 10 * 1024 * 1024,
			write: (chunk, encoding, callback) => {
				const instance = this;
				this.processChunk(chunk, encoding, callback, instance);
			},
		});
		this._createProcess();
	}

	_createProcess() {
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
			.on("error", async (err, stdout, stderr) => {
				console.error("Error:", err);
				console.error("ffmpeg::process::stdout", stdout);
				console.error("ffmpeg::process::stderr", stderr);
			})
			.on("start", async () => {
				const response = await initiateMultipartUpload(
					`record-${this.classId}.webm`
				); // prepare to upload to S3

				this.uploadId = response.UploadId;
				this.partNumber = 1;

				console.log("Multipart upload initiated. Upload ID:", this.uploadId);
			})
			.pipe(this.Writable, { end: true }); // pipe output to writable stream
	}

	async processChunk(chunk, encoding, callback, instance) {
		try {
			if (!instance.uploadId) {
				return;
			}

			const partNumber = instance.partNumber;
			const uploadId = instance.uploadId;

			instance.accumulatedChunks.push(chunk);
			const buffer = Buffer.concat(instance.accumulatedChunks);
			const bufferSize = buffer.length;

			console.log(bufferSize, "new");

			if (bufferSize >= instance.TARGET_SIZE) {
				jobBuffers.set(`${this.classId}${partNumber}`, buffer);

				await recordQueue.add(`${this.classId}-${partNumber}`, {
					type: "uploadPart",
					partNumber: partNumber,
					uploadId: uploadId,
					key: `record-${this.classId}`,
				});

				instance.accumulatedChunks.length = 0;

				instance.partNumber += 1;
				console.log("here");
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

		if (this.process) {
			this.Writable.end();
			await recordQueue.add(`completed-${this.classId}`, {
				type: "uploadComplete",
				key: `record-${this.classId}.webm`,
				uploadId: this.uploadId,
				totalUploads: this.partNumber,
				classId: this.classId,
			});
			this.process.end();
			// this.process.destroy();
			// this.Writable.end();
		}
	}
}

export default FFmpeg;
