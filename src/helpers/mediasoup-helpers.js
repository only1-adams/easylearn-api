import mediasoup from "mediasoup";
import mediasoupConfig from "../utils/mediasoup.config.js";

const createWorker = async () => {
	const worker = await mediasoup.createWorker(mediasoupConfig.worker);

	worker.on("died", (error) => {
		console.error("mediasoup worker has died");
		// Gracefully shut down the process to allow for recovery or troubleshooting.
		setTimeout(() => {
			process.exit(1);
		}, 2000);
	});

	return worker;
};

const createRouter = async (worker) => {
	const router = await worker.createRouter({
		mediaCodecs: mediasoupConfig.router.mediaCodecs,
	});

	return router;
};

export const createTransport = async (transportType, router, options) => {
	console.log(
		"createTransport() [type:%s. options:%o]",
		transportType,
		options
	);

	switch (transportType) {
		case "webRtc":
			return await router.createWebRtcTransport({
				...mediasoupConfig.webRtcTransport,
				...options,
			});
		case "plain":
			return await router.createPlainTransport({
				...mediasoupConfig.plainRtpTransport,
				...options,
			});
	}
};

export { createWorker, createRouter };
