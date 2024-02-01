import { config } from "dotenv";
import Redis from "ioredis";

config();

const redis = new Redis({
	host: process.env.REDIS_HOST,
	port: Number(process.env.REDIS_PORT),
	password: "easylearngangan",
	maxRetriesPerRequest: null,
	lazyConnect: true,
});

export default redis;
