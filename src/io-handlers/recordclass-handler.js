import LiveService from "../services/Live.service.js";
import LiveModel from "../models/Live.model.js";
import ClassModel from "../models/Class.model.js";
import AttendanceModel from "../models/Attendance.model.js";
import CreatorService from "../services/Creator.service.js";
import CreatorModel from "../models/Creator.model.js";
import MessageModel from "../models/Message.model.js";
import MessageService from "../services/Message.service.js";
import ShortUniqueId from "short-unique-id";
import { config } from "dotenv";
import { throwError } from "../helpers/error-helpers.js";
import {
	createNewParticipant,
	getParticipantId,
	getParticipantById,
	deleteParticipant,
	getClassParticipants,
} from "../redis-schemas/Participants.redis.js";

config();

const ips = process.env.LISTEN_IPS.split(",").map((ip) => ({
	ip: "0.0.0.0",
	announcedIp: ip,
}));

const liveService = new LiveService(LiveModel, ClassModel);
const creatorService = new CreatorService(
	CreatorModel,
	ClassModel,
	AttendanceModel
);
const messageService = new MessageService(MessageModel);

let producerTransport;
let consumerTransport;
let producer;
let consumer;
let participantEntityID; // used for getting the participant from redis via Redis-Om

export default async function recordClassHandler(io, socket, worker, router) {
	const { classId, isProducer } = socket.handshake.auth;
	socket.join(classId);

	socket.on("getRtpCapabilities", async (callback) => {
		try {
			const classData = await creatorService.getClassdata(classId);
			if (classData.status === "finished") {
				throwError("This class has been completed");
			}
			callback({ rtpCapabilities: router.rtpCapabilities });
		} catch (error) {
			callback({ error: { message: error.message || "An error occurred!" } });
		}
	});

	socket.on("createProducerTransport", async (callback) => {
		try {
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
		} catch (error) {
			callback({ error: { message: "An error occurred!" } });
		}
	});

	socket.on("createConsumerTransport", async (callback) => {
		try {
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
		} catch (error) {
			callback({ error: { message: "An error occurred!" } });
		}
	});

	socket.on("connectProducerTransport", async (data, callback) => {
		try {
			const { dtlsParameters } = data;
			producerTransport?.connect({ dtlsParameters });
			callback({});
		} catch (error) {
			callback({ error: { message: "An error occurred!" } });
		}
	});

	socket.on("connectConsumerTransport", async (data, callback) => {
		try {
			const { dtlsParameters } = data;
			consumerTransport?.connect({ dtlsParameters });
			callback({});
		} catch (error) {
			callback({ error: { message: "An error occurred!" } });
		}
	});

	socket.on("transport-produce", async (data, callback) => {
		try {
			const { classId } = socket.handshake.auth;
			const { kind, rtpParameters } = data;

			producer = await producerTransport.produce({ kind, rtpParameters });

			producer?.on("transportclose", () => {
				console.log("Producer transport closed");
				producer?.close();
			});

			await liveService.createLive({ class: classId, producerId: producer.id });
			callback({ producerId: producer.id });
		} catch (error) {
			callback({
				error: { message: "An error occurred! Please try again.puui" },
			});
		}
	});

	socket.on("consumeMedia", async (data, callback) => {
		try {
			const { classId, student } = socket.handshake.auth;
			const { rtpCapabilities, transportId } = data;

			const liveClassData = await liveService.getClassLive(classId);

			if (!liveClassData) {
				throwError("Class has not started yet, please try again.");
			}

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

				const { randomUUID } = new ShortUniqueId({ length: 10 });

				let participant = {
					class: classId,
					student: student,
					id: randomUUID(),
				};

				participant = await createNewParticipant(participant);
				participantEntityID = getParticipantId(participant);

				socket.to(classId).emit("newParticipant", participant);

				callback({
					id: consumer.id,
					kind: consumer.kind,
					rtpParameters: consumer.rtpParameters,
					producerId: consumer.producerId,
				});
			}
		} catch (error) {
			callback({
				error: {
					message: error.message || "An error occurred! Please try again",
				},
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
		socket.disconnect();
	});

	socket.on("leaveClass", async () => {
		const { classId } = socket.handshake.auth;
		const participant = await getParticipantById(participantEntityID);

		socket.to(classId).emit("leftClass", participant);
		await deleteParticipant(participant);

		socket.leave(classId);
		socket.disconnect();
	});

	socket.on("disconnect", async () => {
		if (isProducer) {
			await liveService.deleteLiveClass(classId);
			await creatorService.updateClass(classId, { status: "finished" });

			producerTransport?.close();
			io.to(classId).emit("classEnded");
		}

		if (!isProducer) {
			consumerTransport.close();
			const participant = await getParticipantById(participantEntityID);

			io.to(classId).emit("leftClass", participant);
			await deleteParticipant(participant);
		}
	});

	socket.on("message", async (data, callback) => {
		try {
			const message = await messageService.createMessage(data);
			socket.to(classId).emit("message", message);
			callback({ message });
		} catch (error) {
			callback({
				error: {
					message: error.message || "An error occurred! Please try again",
				},
			});
		}
	});

	socket.on("getParticipants", async (cb) => {
		const participants = await getClassParticipants(classId);
		cb({ participants });
	});

	socket.on("startLiveRecord");
}
