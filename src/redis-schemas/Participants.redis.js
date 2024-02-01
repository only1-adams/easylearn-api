import { createClient } from "redis";

import { Schema, Repository, EntityId } from "redis-om";

const redis = createClient({
	socket: {
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT),
	},
	password: "easylearngangan",
});

export let participantRepo;

async function initRedisSchema() {
	await redis.connect();
	
	const participantSchema = new Schema("participant", {
		class: { type: "string" },
		student: { type: "string" },
		id: { type: "string" },
	});

	participantRepo = new Repository(participantSchema, redis);

	await participantRepo.createIndex();

	return true;
}

export const createNewParticipant = async function (participant) {
	return participantRepo.save(participant);
};

export const getParticipantId = function (participant) {
	return participant[EntityId];
};

export const getParticipantById = function (participantEntityID) {
	return participantRepo.fetch(participantEntityID);
};

export const deleteParticipant = async function (participantEntityID) {
	return participantRepo.remove(participantEntityID);
};

export const getClassParticipants = async function (classId) {
	return participantRepo?.search().where("class").eq(classId).return.all();
};

export default initRedisSchema;
