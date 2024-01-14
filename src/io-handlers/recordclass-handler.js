import LiveService from "../services/Live.service.js";
import LiveModel from "../models/Live.model.js";
import ClassModel from "../models/Class.model.js";
import CreatorService from "../services/Creator.service.js";
import CreatorModel from "../models/Creator.model.js";
import { config } from "dotenv";

config();

const ips = process.env.LISTEN_IPS.split(",").map((ip) => ({
	ip: "0.0.0.0",
	announcedIp: ip,
}));

const liveService = new LiveService(LiveModel, ClassModel);
const creatorService = new CreatorService(CreatorModel, ClassModel);

let producerTransport;
let consumerTransport;
let producer;
let consumer;

export default async function recordClassHandler(io, socket, worker, router) {
	const { classId } = socket.handshake.auth;
	socket.join(classId);

	socket.on("getRtpCapabilities", (callback) => {
		callback({ rtpCapabilities: router.rtpCapabilities });
	});

	socket.on("createProducerTransport", async (callback) => {
		producerTransport = await router.createWebRtcTransport({
			listenIps: ips,
			enableUdp: true,
			enableTcp: true,
			preferUdp: true,
		});

		callback({
			transportId: producerTransport.id,
			iceParameters: producerTransport.iceParameters,
			iceCandidates: producerTransport.iceCandidates,
			dtlsParameters: producerTransport.dtlsParameters,
			sctpParameters: producerTransport.sctpParameters,
		});
	});

	socket.on("createConsumerTransport", async (callback) => {
		consumerTransport = await router.createWebRtcTransport({
			listenIps: ips,
			enableUdp: true,
			enableTcp: true,
			preferUdp: true,
		});

		callback({
			transportId: consumerTransport.id,
			iceParameters: consumerTransport.iceParameters,
			iceCandidates: consumerTransport.iceCandidates,
			dtlsParameters: consumerTransport.dtlsParameters,
			sctpParameters: consumerTransport.sctpParameters,
		});
	});

	socket.on("connectProducerTransport", async (data, callback) => {
		const { dtlsParameters } = data;
		producerTransport?.connect({ dtlsParameters });
		callback();
	});

	socket.on("connectConsumerTransport", async (data, callback) => {
		const { dtlsParameters } = data;
		consumerTransport?.connect({ dtlsParameters });
		callback();
	});

	socket.on("transport-produce", async (data, callback) => {
		const { classId } = socket.handshake.auth;
		const { kind, rtpParameters } = data;

		producer = await producerTransport.produce({ kind, rtpParameters });

		producer?.on("transportclose", () => {
			console.log("Producer transport closed");
			producer?.close();
		});

		await liveService.createLive({ class: classId, producerId: producer.id });
		callback({ producerId: producer.id });
	});

	socket.on("consumeMedia", async (data, callback) => {
		const { classId } = socket.handshake.auth;
		const { rtpCapabilities, transportId } = data;

		const liveClassData = await liveService.getClassLive(classId);
		const producerId = liveClassData.producerId;

		if (router.canConsume({ producerId, rtpCapabilities })) {
			consumer = await consumerTransport.consume({
				producerId,
				rtpCapabilities,
				paused: true,
			});

			// Event handler for transport closure
			// This helps ensure that resources are cleaned up when the transport is closed
			consumer?.on("transportclose", () => {
				console.log("Consumer transport closed");
				consumer?.close();
			});

			// Event handler for producer closure
			// This helps ensure that the consumer is closed when the producer is closed
			consumer?.on("producerclose", () => {
				console.log("Producer closed");
				consumer?.close();
			});

			callback({
				id: consumer.id,
				kind: consumer.kind,
				rtpParameters: consumer.rtpParameters,
				producerId: consumer.producerId,
			});
		}
	});

	socket.on("resumeConsumer", () => {
		consumer?.resume();
	});

	socket.on("endLiveClass", async () => {
		const { classId } = socket.handshake.auth;
		await liveService.deleteLiveClass(classId);
		await creatorService.updateClass(classId, { status: "finished" });

		producerTransport.close();
		socket.to(classId).emit("classEnded");
	});
}
