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
import { createRouter } from "../helpers/mediasoup-helpers.js";

config();

const liveService = new LiveService(LiveModel, ClassModel);
const creatorService = new CreatorService(
	CreatorModel,
	ClassModel,
	AttendanceModel
);
const messageService = new MessageService(MessageModel);

let participantEntityID; // used for getting the participant from redis via Redis-Om
let intervalId;

const liveClasses = new Map();

export default async function recordClassHandler(
	io,
	socket,
	mediasoupProductionWorker,
	mediasoupConsumptionWorker
) {
	const { classId, isProducer } = socket.handshake.auth;
	socket.join(classId);
	socket.transportIds = [];

	if (isProducer) {
		try {
			const liveClass = new LiveClass(classId);
			const producerRouter = await createRouter(mediasoupProductionWorker);
			const consumerRouter = await createRouter(mediasoupConsumptionWorker);
			liveClass.setProducerRouter(producerRouter);
			liveClass.setConsumerRouter(consumerRouter);
			liveClasses.set(classId, liveClass);
		} catch (error) {
			console.log(error, "creating routers");
		}
	}

	socket.on("getRtpCapabilities", async (callback) => {
		try {
			const classData = await creatorService.getClassdata(classId);
			const liveClass = liveClasses.get(classId);

			if (classData.status === "finished") {
				throwError("This class has been completed");
			}

			if (!liveClass) {
				throwError("This class has been completed or has not started yet");
			}

			const routerToUse = isProducer
				? liveClass.routers.producerRouter
				: liveClass.routers.consumerRouter;

			callback({
				rtpCapabilities: routerToUse.rtpCapabilities,
			});
		} catch (error) {
			console.log(error);
			callback({ error: { message: error.message || "An error occurred!" } });
		}
	});

	socket.on("createTransport", async (callback) => {
		try {
			const liveClass = liveClasses.get(classId);

			const routerToUse = isProducer
				? liveClass.routers.producerRouter
				: liveClass.routers.consumerRouter;

			const transport = await createTransport("webRtc", routerToUse);

			transport.on("routerclose", () => {
				transport.close();
			});

			liveClass.addTransport(transport);
			socket.transportIds.push(transport.id);

			callback({
				transportId: transport.id,
				iceParameters: transport.iceParameters,
				iceCandidates: transport.iceCandidates,
				dtlsParameters: transport.dtlsParameters,
				sctpParameters: transport.sctpParameters,
			});
		} catch (error) {
			console.log(error);
			callback({ error: { message: "An error occurred!" } });
		}
	});

	socket.on("connectTransport", async (data, callback) => {
		const { dtlsParameters, transportId } = data;

		try {
			const liveClass = liveClasses.get(classId);
			const transport = liveClass.getTransport(transportId);
			transport.connect({ dtlsParameters });
			callback({ message: "transport connected" });
		} catch (error) {
			console.log(error);
			callback({ error: { message: "An error occurred!" } });
		}
	});

	socket.on("transport-produce", async (data, callback) => {
		try {
			const { kind, rtpParameters, transportId } = data;

			const liveClass = liveClasses.get(classId);

			if (!liveClass) {
				throwError();
			}

			const producerRouter = liveClass.routers.producerRouter;
			const consumerRouter = liveClass.routers.consumerRouter;
			const transport = liveClass.getTransport(transportId);

			const producer = await transport.produce({ kind, rtpParameters });
			liveClass.addProducer(producer);
			producer?.on("transportclose", () => {
				console.log("Producer transport closed");
				producer?.close();
			});

			await producerRouter.pipeToRouter({
				producerId: producer.id,
				router: consumerRouter,
			});

			callback({ producerId: producer.id });
		} catch (error) {
			console.log(error);
			callback({
				error: { message: "An error occurred! Please try again" },
			});
		}
	});

	socket.on("consumeMedia", async (data, callback) => {
		try {
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
				liveClass.routers.producerRouter.canConsume({
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

				callback({
					id: consumer.id,
					kind: consumer.kind,
					rtpParameters: consumer.rtpParameters,
					producerId: consumer.producerId,
				});
			}
		} catch (error) {
			console.log(error);
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
		const liveClass = liveClasses.get(classId);

		try {
			await liveService.createLive({
				class: classId,
				producers: [liveClass.producers[0].id, liveClass.producers[1].id],
				routers: [
					liveClass.routers.producerRouter?.id,
					liveClass.routers.consumerRouter?.id,
				],
			});

			callback({ message: "Live class created successfully" });
		} catch (error) {
			console.log(error, "crtta");
			callback({
				error: {
					message: error.message || "An error occurred! Please try again",
				},
			});
		}
	});

	socket.on("endLiveClass", async (data, callback) => {
		try {
			const { classId } = socket.handshake.auth;
			const { transportId, audioTransportId } = data;

			socket.to(classId).emit("classEnded");

			const liveClass = liveClasses.get(classId);
			// const transport = liveClass.getTransport(transportId);
			// const audioTransport = liveClass.getTransport(audioTransportId);

			liveClass.routers.producerRouter.close();
			liveClass.routers.consumerRouter.close();

			const participants = await getClassParticipants(classId);

			if (participants) {
				await Promise.all(
					participants.map(async (participant) => {
						const id = getParticipantId(participant);
						await deleteParticipant(id);
						return true;
					})
				);
			}

			liveClasses.delete(classId);
			await liveService.deleteLiveClass(classId);
			await creatorService.updateClass(classId, { status: "finished" });

			callback({ message: "ended" });
		} catch (error) {
			console.log(error);
			callback({
				error: {
					message: error.message || "An error occurred! Please try again",
				},
			});
		}
	});

	socket.on("leaveClass", async (data) => {
		const { classId } = socket.handshake.auth;
		const { transportId, audioTransportId } = data;

		const liveClass = liveClasses.get(classId);
		const transport = liveClass.getTransport(transportId);
		const audioTransport = liveClass.getTransport(audioTransportId);

		const participant = await getParticipantById(participantEntityID);

		socket.to(classId).emit("leftClass", participant);
		await deleteParticipant(socket.participantEntityID);
		participantEntityID = null;

		transport?.close();
		audioTransport?.close();

		socket.transportIds = [];
		socket.leave(classId);
		socket.disconnect();
	});

	socket.on("disconnect", async () => {
		const { classId } = socket.handshake.auth;
		const liveClass = liveClasses.get(classId);

		if (liveClass && isProducer) {
			await liveService.deleteLiveClass(classId);
			await creatorService.updateClass(classId, { status: "finished" });

			await liveClass.process?.kill();
			liveClass.process = undefined;
			liveClass.remotePorts.forEach((port) => releasePort(port));

			liveClass.routers.producerRouter.close();
			liveClass.routers.consumerRouter.close();

			liveClasses.delete(classId);

			await creatorService.updateClass(classId, { endTime: Date.now() });

			io.to(classId).emit("classEnded");
		}

		if (liveClass && !isProducer) {
			if (socket.participantEntityID) {
				socket.transportIds.forEach((id) => {
					const transport = liveClass.getTransport(id);
					transport?.close();
				});

				const participant = await getParticipantById(
					socket.participantEntityID
				);

				io.to(classId).emit("leftClass", participant);
				await deleteParticipant(participantEntityID);
			}
		}
	});

	socket.on("message", async (data, callback) => {
		const { classId } = socket.handshake.auth;

		try {
			const message = await messageService.createMessage(data);
			socket.to(classId).emit("messageReceived", message);
			callback({ message });
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
				id: randomUUID(), // unique id to identify a participant
			};

			participant = await createNewParticipant(participant);
			participantEntityID = getParticipantId(participant);
			socket.participantEntityID = participantEntityID;

			socket.to(classId).emit("newParticipant", participant);
			callback({ message: "Done" });
		} catch (error) {
			console.log(error);
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

	socket.on("startLiveRecord", async (data, callback) => {
		const { classId } = socket.handshake.auth;
		const { isMobile } = data;

		console.log("isMobile:", isMobile);

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

			// Create the mediasoup RTP Transport used to send media to the FFMPEG process
			for (const producer of producers) {
				const rtpTransport = await createTransport(
					"plain",
					liveClass.routers.producerRouter,
					{
						appData: { forRecord: true },
					}
				);

				rtpTransport.on("routerclose", () => {
					rtpTransport.close();
				});

				socket.transportIds.push(rtpTransport.id);

				const { data: info, consumer } = await publishProducerRtpStream(
					liveClass,
					producer,
					rtpTransport,
					liveClass.routers.producerRouter
				);

				recordInfo[producer.kind] = info;

				setTimeout(async () => {
					await consumer.resume();
					await consumer.requestKeyFrame();
				}, 1000);
			}

			recordInfo.fileName = Date.now().toString();
			liveClass.process = new FFmpeg(recordInfo, classId, isMobile);

			await creatorService.updateClass(classId, {
				startTime: Date.now(),
				isMobile,
			});

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

		await liveClass.process?.kill();
		liveClass.process = undefined;
		liveClass.remotePorts.forEach((port) => releasePort(port));

		await creatorService.updateClass(classId, { endTime: Date.now() });

		callback({ message: "done" });
	});
}
