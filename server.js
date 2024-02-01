import { config } from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import dbConnection from "./db-connection.js";
import recordClassHandler from "./src/io-handlers/recordclass-handler.js";
import { createWorker, createRouter } from "./src/helpers/mediasoup-helpers.js";
import { activationMailWorker } from "./src/queues/mail.queue.js";
import redis from "./redis-connection.js";
import initRedisSchema from "./src/redis-schemas/Participants.redis.js";

config();

let worker;
let router;

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: [process.env.CLIENT_BASE_URL],
	},
});

io.of("/live/record").on("connection", (socket) => {
	recordClassHandler(io, socket, worker, router);
});

dbConnection.once("open", async () => {
	worker = await createWorker();
	router = await createRouter(worker);
	redis.connect(async () => {
		await initRedisSchema();
		activationMailWorker.run();
		server.listen(process.env.PORT || 8000);
		console.log("connected");
	});
});

const gracefulShutdown = async (signal) => {
	console.log(`Received ${signal}, closing server...`);
	await activationMailWorker.close();

	await redis.quit();
	// Other asynchronous closings
	process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// 52.41.36.82,54.191.253.12,44.226.122.3
