import { config } from "dotenv";
import Ffmpeg from "fluent-ffmpeg";
import { createSdpText, convertStringToStream } from "./live-record-helpers.js";
import { EventEmitter } from "events";

config();

const RECORD_FILE_LOCATION_PATH =
	process.env.RECORD_FILE_LOCATION_PATH || "./files";

class FFmpeg {
	constructor(rtpParameters) {
		this.rtpParameters = rtpParameters;
		this._observer = new EventEmitter();
		this._createProcess();
	}

	_createProcess() {
		const sdpString = createSdpText(this.rtpParameters);
		const sdpStream = convertStringToStream(sdpString);

		console.log("createProcess() [sdpString:%s]", sdpString);

		this._process = Ffmpeg()
			.input(sdpStream)
			.inputFormat("sdp")
			.inputOptions([
				"-protocol_whitelist",
				"pipe,udp,rtp",
				"-fflags",
				"+genpts",
			])
			.videoCodec("copy")
			.audioCodec("copy")
			.output(
				`${RECORD_FILE_LOCATION_PATH}/${this.rtpParameters.fileName}.webm`
			)
			.on("error", (err, stdout, stderr) => {
				console.error("Error:", err);
				console.error("ffmpeg::process::stdout", stdout);
				console.error("ffmpeg::process::stderr", stderr);
			})
			.on("end", () => {
				console.log("ffmpeg::process::end");
				this._observer.emit("process-close");
			});

		sdpStream.on("error", (error) =>
			console.error("sdpStream::error [error:%o]", error)
		);

		this._process.run();
	}

	kill() {
		console.log("kill()");
		if (this._process) {
			this._process.kill();
		}
	}
}

export default FFmpeg;
