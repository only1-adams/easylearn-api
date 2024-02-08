import { config } from "dotenv";
import Redis from "ioredis";

config();

const redis = new Redis({
	host: process.env.REDIS_HOST,
	port: Number(process.env.REDIS_PORT),
	password: process.env.REDIS_PASSWORD,
	maxRetriesPerRequest: null,
	lazyConnect: true,
});

redis.on("error", (err) => {
	console.log(err);
	process.exit(1);
});

export default redis;
