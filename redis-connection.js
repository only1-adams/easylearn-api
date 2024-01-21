import { config } from "dotenv";
import { createClient } from "redis";
config();

const redisConnectionConfig = {
	socket: {
		host: process.env.REDIS_HOST,
		port: Number(process.env.REDIS_PORT),
	},
	password: "easylearngangan",
	enable_offline_queue: false,
};

export const redis = createClient(redisConnectionConfig);

redis.on("error", (err) => console.log("Redis Client Error", err));

export default redisConnectionConfig;
