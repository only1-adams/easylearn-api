import LiveService from "../services/Live.service.js";
import LiveModel from "../models/Live.model.js";
import ClassModel from "../models/Class.model.js";
import AttendanceModel from "../models/Attendance.model.js";
import CreatorService from "../services/Creator.service.js";
import CreatorModel from "../models/Creator.model.js";
import MessageModel from "../models/Message.model.js";
import MessageService from "../services/Message.service.js";
import ShortUniqueId from "short-unique-id";
import { createTransport } from "../helpers/mediasoup-helpers.js";
import { config } from "dotenv";
import { throwError } from "../helpers/error-helpers.js";
import {
	createNewParticipant,
	getParticipantId,
	getParticipantById,
	deleteParticipant,
	getClassParticipants,
} from "../redis-schemas/Participants.redis.js";
import LiveClass from "../helpers/live-class.js";
import {
	publishProducerRtpStream,
	releasePort,
} from "../helpers/live-record-helpers.js";
import FFmpeg from "../helpers/fluent-ffmpeg.js";

config();

const liveService = new LiveService(LiveModel, ClassModel);
const creatorService = new CreatorService(
	CreatorModel,
	ClassModel,
	AttendanceModel
);
const messageService = new MessageService(MessageModel);

let participantEntityID; // used for getting the participant from redis via Redis-Om

const liveClasses = new Map();

export default async function recordClassHandler(io, socket, worker, router) {
	const { classId, isProducer } = socket.handshake.auth;
	socket.join(classId);
	socket.consumerIds = [];

	const liveClass = new LiveClass(classId);
	liveClasses.set(classId, liveClass);

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

	socket.on("createTransport", async (callback) => {
		const { classId } = socket.handshake.auth;

		try {
			const liveClass = liveClasses.get(classId);
			const transport = await createTransport("webRtc", router);

			liveClass.addTransport(transport);

			callback({
				transportId: transport.id,
				iceParameters: transport.iceParameters,
				iceCandidates: transport.iceCandidates,
				dtlsParameters: transport.dtlsParameters,
				sctpParameters: transport.sctpParameters,
			});
		} catch (error) {
			callback({ error: { message: "An error occurred!" } });
		}
	});

	socket.on("connectTransport", async (data, callback) => {
		const { classId } = socket.handshake.auth;
		const { dtlsParameters, transportId } = data;

		try {
			const liveClass = liveClasses.get(classId);
			const transport = liveClass.getTransport(transportId);
			transport.connect({ dtlsParameters });
			callback({});
		} catch (error) {
			callback({ error: { message: "An error occurred!" } });
		}
	});

	socket.on("transport-produce", async (data, callback) => {
		try {
			const { classId } = socket.handshake.auth;
			const { kind, rtpParameters, transportId } = data;

			const liveClass = liveClasses.get(classId);
			const transport = liveClass.getTransport(transportId);

			const producer = await transport.produce({ kind, rtpParameters });

			liveClass.addProducer(producer);

			producer?.on("transportclose", () => {
				console.log("Producer transport closed");
				producer?.close();
			});

			callback({ producerId: producer.id });
		} catch (error) {
			callback({
				error: { message: "An error occurred! Please try again.puui" },
			});
		}
	});

	socket.on("consumeMedia", async (data, callback) => {
		try {
			const { classId } = socket.handshake.auth;
			const { rtpCapabilities, transportId, kind } = data;

			const liveClass = liveClasses.get(classId);
			const transport = liveClass.getTransport(transportId);

			const liveClassData = await liveService.getClassLive(classId);

			if (!liveClassData) {
				throwError("Class has not started yet, please try again.");
			}

			const producers = liveClassData.producers;
			const videoProducerId = producers[0];
			const audioProducerId = producers[1];

			if (
				router.canConsume({
					producerId: kind === "video" ? videoProducerId : audioProducerId,
					rtpCapabilities,
				})
			) {
				const consumer = await transport.consume({
					producerId: kind === "video" ? videoProducerId : audioProducerId,
					rtpCapabilities,
					paused: true,
				});

				liveClass.addConsumer(consumer);

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

				socket.consumerIds.push(consumer.id);

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

	socket.on("newParticipant", async (callback) => {
		const { classId, student } = socket.handshake.auth;

		try {
			const { randomUUID } = new ShortUniqueId({ length: 10 });

			let participant = {
				class: classId,
				student: student,
				id: randomUUID(),
			};

			participant = await createNewParticipant(participant);
			participantEntityID = getParticipantId(participant);

			socket.to(classId).emit("newParticipant", participant);
			callback({ message: "Done" });
		} catch (error) {
			callback({
				error: {
					message: error.message || "An error occurred! Please try again",
				},
			});
		}
	});

	socket.on("resumeConsumer", (data, callback) => {
		const { classId } = socket.handshake.auth;
		const { consumerId } = data;

		const liveClass = liveClasses.get(classId);

		const consumer = liveClass.getConsumer(consumerId);

		consumer?.resume();

		callback({ message: "resumed" });
	});

	socket.on("createLiveClass", async (callback) => {
		const { classId } = socket.handshake.auth;
		const liveClass = liveClasses.get(classId);
		try {
			await liveService.createLive({
				class: classId,
				producers: [liveClass.producers[0].id, liveClass.producers[1].id],
			});
			callback({ message: "Live created successfully" });
		} catch (error) {
			console.log(error, "crtta");
			callback({
				error: {
					message: error.message || "An error occurred! Please try again",
				},
			});
		}
	});

	socket.on("endLiveClass", async (data) => {
		const { classId } = socket.handshake.auth;
		const { transportId, audioTransportId } = data;

		const liveClass = liveClasses.get(classId);
		const transport = liveClass.getTransport(transportId);
		const audioTransport = liveClass.getTransport(audioTransportId);

		await liveService.deleteLiveClass(classId);
		await creatorService.updateClass(classId, { status: "finished" });

		transport?.close();
		audioTransport?.close();
		socket.to(classId).emit("classEnded");
		// socket.disconnect();
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
		const { classId } = socket.handshake.auth;

		if (isProducer) {
			const liveClass = liveClasses.get(classId);

			await liveService.deleteLiveClass(classId);
			await creatorService.updateClass(classId, { status: "finished" });

			liveClass.producers.forEach((producer) => producer.close());
			io.to(classId).emit("classEnded");
		}

		if (!isProducer) {
			const liveClass = liveClasses.get(classId);

			if (socket.consumerIds) {
				socket.consumerIds.forEach((consumerId) => {
					const consumer = liveClass.getConsumer(consumerId);
					consumer.close();
				});
				const participant = await getParticipantById(participantEntityID);
				io.to(classId).emit("leftClass", participant);
				await deleteParticipant(participant);
			}
		}
	});

	socket.on("message", async (data, callback) => {
		const { classId } = socket.handshake.auth;

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
		const { classId } = socket.handshake.auth;

		const participants = await getClassParticipants(classId);
		cb({ participants });
	});

	socket.on("startLiveRecord", async (callback) => {
		const { classId } = socket.handshake.auth;

		try {
			const liveClassData = await liveService.getClassLive(classId);

			if (!liveClassData) {
				throwError("Class has not started yet, please try again.");
			}

			let recordInfo = {};
			let producers = liveClassData.producers;

			const liveClass = liveClasses.get(classId);
			producers = [
				liveClass.getProducer(producers[0]),
				liveClass.getProducer(producers[1]),
			];

			// Create the mediasoup RTP Transport used to send media to the GStreamer process
			for (const producer of producers) {
				const rtpTransport = await createTransport("plain", router);
				const { data: info, consumer } = await publishProducerRtpStream(
					liveClass,
					producer,
					rtpTransport,
					router
				);
				console.log(producer.kind, info);
				recordInfo[producer.kind] = info;

				setTimeout(async () => {
					await consumer.resume();
					await consumer.requestKeyFrame();
				}, 1000);
			}

			recordInfo.fileName = Date.now().toString();
			liveClass.process = new FFmpeg(recordInfo);

			callback({ message: "done" });
		} catch (error) {
			callback({
				error: {
					message: error.message || "An error occurred! Please try again",
				},
			});
		}
	});

	socket.on("stopLiveRecord", async (callback) => {
		const { classId } = socket.handshake.auth;
		const liveClass = liveClasses.get(classId);

		liveClass.process.kill();
		liveClass.process = undefined;
		liveClass.remotePorts.forEach((port) => releasePort(port));
		callback({ message: "done" });
	});
}
