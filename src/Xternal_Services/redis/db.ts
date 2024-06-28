import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redis = createClient({
	url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redis.on("error", (err) => console.log("Redis Client Error", err));

(async () => {
	await redis.connect();
})();

export default redis;
