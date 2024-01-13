import { config } from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import dbConnection from "./db-connection.js";
import recordClassHandler from "./src/io-handlers/recordclass-handler.js";
import { createWorker, createRouter } from "./src/helpers/mediasoup-helpers.js";

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
	server.listen(process.env.PORT || 8000);
	worker = await createWorker();
	router = await createRouter(worker);
	console.log("connected");
});
