import Redis from "ioredis";
import { generateRedisAuthToken } from "./iamRedisAuth";

const host = "your-redis-host";
const port = 6379;
const region = "ap-south-1";

export const createRedisClient = async () => {
  const token = await generateRedisAuthToken(host, port, region);

  const redis = new Redis({
    host,
    port,
    username: "default",
    password: token,
    tls: {}, // REQUIRED
  });

  return redis;
};
