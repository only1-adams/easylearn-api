import { config } from "dotenv";
import mediasoupConfig from "../utils/mediasoup.config.js";
import { Readable } from "stream";

config();

const MIN_PORT = 20000;
const MAX_PORT = 30000;

const takenPortSet = new Set();

const getRandomPort = () =>
	Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1) + MIN_PORT);

export const getPort = async () => {
	let port = getRandomPort();

	while (takenPortSet.has(port)) {
		port = getRandomPort();
	}

	takenPortSet.add(port);

	return port;
};

export const releasePort = (port) => takenPortSet.delete(port);

export const convertStringToStream = (stringToConvert) => {
	const stream = new Readable();
	stream._read = () => {};
	stream.push(stringToConvert);
	stream.push(null);

	return stream;
};

export const getCodecInfoFromRtpParameters = (kind, rtpParameters) => {
	return {
		payloadType: rtpParameters.codecs[0].payloadType,
		codecName: rtpParameters.codecs[0].mimeType.replace(`${kind}/`, ""),
		clockRate: rtpParameters.codecs[0].clockRate,
		channels: kind === "audio" ? rtpParameters.codecs[0].channels : undefined,
	};
};

export const createSdpText = (rtpParameters) => {
	const kind = rtpParameters;

	console.log(kind, "sdp");

	let videoCodecInfo;
	let audioCodecInfo;

	if (kind.video) {
		// Video codec info
		videoCodecInfo = getCodecInfoFromRtpParameters(
			"video",
			kind.video.rtpParameters
		);
	}

	if (kind.audio) {
		// Audio codec info
		audioCodecInfo = getCodecInfoFromRtpParameters(
			"audio",
			kind.audio.rtpParameters
		);
	}

	return `v=0
  o=- 0 0 IN IP4 ${process.env.LISTEN_IPS}
  s=FFmpeg
  c=IN IP4 ${process.env.LISTEN_IPS}
  t=0 0
  m=video ${kind.video.remoteRtpPort} RTP/AVP ${videoCodecInfo.payloadType} 
  a=rtpmap:${videoCodecInfo.payloadType} ${videoCodecInfo.codecName}/${videoCodecInfo.clockRate}
  a=sendonly
  m=audio ${kind.audio.remoteRtpPort} RTP/AVP ${audioCodecInfo.payloadType}
  a=rtpmap:${audioCodecInfo.payloadType} ${audioCodecInfo.codecName}/${audioCodecInfo.clockRate}/${audioCodecInfo.channels}
  a=sendonly
  `;
};

export const publishProducerRtpStream = async (
	liveClass,
	producer,
	transport,
	router
) => {
	console.log("publishProducerRtpStream()");

	const rtpTransportConfig = mediasoupConfig.plainRtpTransport;

	// Set the receiver RTP ports
	const remoteRtpPort = await getPort();
	liveClass.remotePorts.push(remoteRtpPort);

	let remoteRtcpPort;
	// If rtpTransport rtcpMux is false also set the receiver RTCP ports
	if (!rtpTransportConfig.rtcpMux) {
		remoteRtcpPort = await getPort();
		liveClass.remotePorts.push(remoteRtcpPort);
	}

	// Connect the mediasoup RTP transport to the ports used by GStreamer
	await transport.connect({
		ip: `${process.env.LISTEN_IPS}`,
		port: remoteRtpPort,
		rtcpPort: remoteRtcpPort,
	});

	liveClass.addTransport(transport);

	const codecs = [];
	// Codec passed to the RTP Consumer must match the codec in the Mediasoup router rtpCapabilities
	const routerCodec = router.rtpCapabilities.codecs.find(
		(codec) => codec.kind === producer.kind
	);
	codecs.push(routerCodec);

	const rtpCapabilities = {
		codecs,
		rtcpFeedback: [],
	};

	// Start the consumer paused
	// Once the gstreamer process is ready to consume resume and send a keyframe
	const rtpConsumer = await transport.consume({
		producerId: producer.id,
		rtpCapabilities,
		paused: true,
	});

	liveClass.addConsumer(rtpConsumer);

	return {
		data: {
			remoteRtpPort,
			remoteRtcpPort,
			localRtcpPort: transport.rtcpTuple
				? transport.rtcpTuple.localPort
				: undefined,
			rtpCapabilities,
			rtpParameters: rtpConsumer.rtpParameters,
		},
		consumer: rtpConsumer,
	};
};
