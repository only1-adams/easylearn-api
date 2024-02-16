import { config } from "dotenv";
import Ffmpeg from "fluent-ffmpeg";
import { createSdpText, convertStringToStream } from "./live-record-helpers.js";
import { Writable } from "stream";
import { initiateMultipartUpload } from "./s3-upload-helpers.js";
import { S3Client } from "@aws-sdk/client-s3";
import recordedVideoUploader from "./recorded-video-uploader.js";

config();

const s3Client = new S3Client({ region: "us-east-1", forcePathStyle: true });

class FFmpeg {
	constructor(rtpParameters, classId, isMobile) {
		this.rtpParameters = rtpParameters;
		this.classId = classId;
		this.process = null; // To keep track of the FFmpeg process
		this.uploadId = null; // To store the ID of the AWS S3 multipart upload
		this.accumulatedChunks = [];
		this.partNumber = 0; // used to store the total number of parts uploaded to s3
		this.TARGET_SIZE = 5 * 1024 * 1024; // Mb of chunks per s3 upload
		this.totalSize = 0; // total of of chunks accumulated
		this.isMobile = isMobile;

		this.Writable = new Writable({
			highWaterMark: 10 * 1024 * 1024,
			write: (chunk, encoding, callback) => {
				const instance = this; // saving the current instance, so we can use it in the write method
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
		if (this.isMobile) {
			this.mobileProcess(sdpStream);
		} else {
			this.PCProcess(sdpStream);
		}
	}

	mobileProcess(sdpStream) {
		this.process = Ffmpeg()
			.input(sdpStream)
			.inputFormat("sdp")
			.inputOptions(["-protocol_whitelist", "pipe,udp,rtp"])
			.videoFilters("transpose=1") // setting correct video orientation for mobile
			.audioCodec("copy")
			.outputFormat("webm")
			.on("start", async () => {
				await this.prepareToUploadToS3();
			})
			.on("error", async (err, stdout, stderr) => {
				console.error("Error:", err);
				console.error("ffmpeg::process::stdout", stdout);
				console.error("ffmpeg::process::stderr", stderr);
			})
			.pipe(this.Writable, { end: true }); // pipe output to writable stream
	}

	PCProcess(sdpStream) {
		this.process = Ffmpeg()
			.input(sdpStream)
			.inputFormat("sdp")
			.inputOptions(["-protocol_whitelist", "pipe,udp,rtp"])
			.videoCodec("copy")
			.audioCodec("copy")
			.outputFormat("webm")
			.on("start", async () => {
				await this.prepareToUploadToS3();
			})
			.on("error", async (err, stdout, stderr) => {
				console.error("Error:", err);
				console.error("ffmpeg::process::stdout", stdout);
				console.error("ffmpeg::process::stderr", stderr);
			})
			.pipe(this.Writable, { end: true }); // pipe output to writable stream
	}

	async prepareToUploadToS3() {
		const response = await initiateMultipartUpload(
			`record-${this.classId}.webm`,
			s3Client
		);

		this.uploadId = response.UploadId;

		this.uploader = new recordedVideoUploader(
			response.UploadId,
			this.classId,
			s3Client
		);

		console.log("Multipart upload initiated. Upload ID:", this.uploadId);

		return true;
	}

	async processChunk(chunk, encoding, callback, instance) {
		try {
			instance.accumulatedChunks.push(chunk); // store the accumulated chunk
			instance.totalSize += chunk.length; // increment the total size

			console.log(instance.totalSize);

			// check if the size of the chunk is equal or greater than the target size
			if (instance.totalSize >= instance.TARGET_SIZE) {
				console.log(instance.totalSize, "in");
				instance.partNumber += 1; // increment part number

				const buffer = instance.createBufferFromChunks(instance); // create buffer

				instance.uploader.initiateUpload(
					instance.partNumber,
					buffer,
					`record-${instance.classId}.webm`
				);

				instance.resetAccumulatedChunks(instance); // reset accumulated chunks
			}

			callback();
		} catch (error) {
			callback(error);
		}
	}

	createBufferFromChunks(instance) {
		const buffer = Buffer.alloc(instance.totalSize);
		let offset = 0;
		for (const chunk of instance.accumulatedChunks) {
			chunk.copy(buffer, offset);
			offset += chunk.length;
		}
		return buffer;
	}

	resetAccumulatedChunks(instance) {
		instance.accumulatedChunks = [];
		instance.totalSize = 0;
	}

	uploadChunksLeft() {
		// check if there are any chunks left
		if (this.accumulatedChunks.length > 0) {
			this.partNumber += 1;
			const buffer = this.createBufferFromChunks(this);
			this.uploader.initiateUpload(
				this.partNumber,
				buffer,
				`record-${this.classId}.webm`
			);
		}
	}

	async kill() {
		if (!this.process) {
			console.log("no process");
			return;
		}

		console.log("end");

		this.uploadChunksLeft();

		await this.uploader.complete(
			this.partNumber,
			`record-${this.classId}.webm`
		);

		this.process.end(); // terminate ffmpeg
		this.Writable.end(); // end writable stream
	}
}

export default FFmpeg;
