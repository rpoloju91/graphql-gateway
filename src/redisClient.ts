import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";

dotenv.config();

const host = process.env.REDIS_HOST!;
const port = Number(process.env.REDIS_PORT!);
const region = process.env.AWS_REGION!;

let redisClient: RedisClientType | null = null;
let lastConnectedTime = 0;

const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 mins

// 🔹 Generate IAM Token
async function generateIamToken(): Promise<string> {
  const credentials = await defaultProvider()();

  const signer = new SignatureV4({
    service: "elasticache",
    region,
    credentials,
    sha256: Sha256,
  });

  const request = {
    method: "GET",
    protocol: "https:",
    hostname: host,
    path: "/",
    headers: {
      host: `${host}:${port}`,
    },
  };

  const signed = await signer.sign(request);

  return signed.headers["authorization"] as string;
}

// 🔹 Create New Redis Client
async function createRedisClient(): Promise<RedisClientType> {
  const token = await generateIamToken();

  const client: RedisClientType = createClient({
    socket: {
      host,
      port,
      tls: true, // REQUIRED for IAM
    },
    username: "default",
    password: token,
  });

  client.on("error", (err) =>
    console.error("❌ Redis Error:", err)
  );

  client.on("connect", () =>
    console.log("✅ Connected to IAM Redis")
  );

  await client.connect();

  return client;
}

// 🔹 Public method (with auto refresh)
export async function getRedisClient(): Promise<RedisClientType> {
  const now = Date.now();

  if (
    !redisClient ||
    !redisClient.isOpen ||
    now - lastConnectedTime > TOKEN_REFRESH_INTERVAL
  ) {
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch (e) {
        console.warn("Redis cleanup failed:", e);
      }
    }

    redisClient = await createRedisClient();
    lastConnectedTime = now;
  }

  return redisClient;
}


--------------------------------------------------
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
//--------------------------------------
import { createClient } from "redis";
import dotenv from "dotenv";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";

dotenv.config();

const host = process.env.REDIS_HOST!;
const port = Number(process.env.REDIS_PORT!);
const region = process.env.AWS_REGION!;

// 🔹 Generate IAM Token
async function generateIamToken() {
  const credentials = await defaultProvider()();

  const signer = new SignatureV4({
    service: "elasticache",
    region,
    credentials,
    sha256: Sha256,
  });

  const request = {
    method: "GET",
    protocol: "https:",
    hostname: host,
    path: "/",
    headers: {
      host: `${host}:${port}`,
    },
  };

  const signed = await signer.sign(request);

  return signed.headers["authorization"]; // IAM token
}

// 🔹 Create Redis Client
export async function connectRedis() {
  const token = await generateIamToken();

  const redisClient = createClient({
    socket: {
      host,
      port,
      tls: true, // REQUIRED
    },
    username: "default",
    password: token,
  });

  redisClient.on("error", (err) =>
    console.error("Remote Redis Error:", err)
  );

  redisClient.on("connect", () =>
    console.log("✅ Connected to IAM Redis")
  );

  await redisClient.connect();

  return redisClient;
}
