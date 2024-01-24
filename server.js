import { config } from "dotenv";
import https from "https";
import fs from "fs";
import { Server } from "socket.io";
import app from "./src/app.js";
import dbConnection from "./db-connection.js";
import recordClassHandler from "./src/io-handlers/recordclass-handler.js";
import { createWorker, createRouter } from "./src/helpers/mediasoup-helpers.js";
import { activationMailWorker } from "./src/queues/mail.queue.js";
import { redis } from "./redis-connection.js";
import initRedisSchema from "./src/redis-schemas/Participants.redis.js";

config();

let worker;
let router;

const options = {
	key: fs.readFileSync("./localhost-key.pem"),
	cert: fs.readFileSync("./localhost.pem"),
};

const server = https.createServer(options, app);

const io = new Server(server, {
	cors: {
		origin: [process.env.CLIENT_BASE_URL],
	},
});

io.of("/live/record").on("connection", (socket) => {
	recordClassHandler(io, socket, worker, router);
});

dbConnection.once("open", async () => {
	server.listen(process.env.PORT || 8000);
	worker = await createWorker();
	router = await createRouter(worker);
	await redis.connect();
	await initRedisSchema();
	activationMailWorker.run();
	console.log("connected");
});

// 52.41.36.82,54.191.253.12,44.226.122.3
