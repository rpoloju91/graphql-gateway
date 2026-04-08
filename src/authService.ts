import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";
import { getRedisClient } from "../redisClient";

export async function login(
  userName: string,
  password: string,
  logger: any
) {
  const clientId = process.env.AWS_CLIENT_ID!;
  const clientSecret = process.env.AWS_CLIENT_SECRET!;
  const region = process.env.AWS_REGION!;

  const secretHash = createHmac("sha256", clientSecret)
    .update(userName + clientId)
    .digest("base64");

  const client = new CognitoIdentityProviderClient({ region });

  try {
    logger.info("Initiating USER_AUTH flow...");

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: userName,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    });

    const response = await client.send(command);

    if (response.AuthenticationResult?.AccessToken) {
      const token = response.AuthenticationResult.AccessToken;

      const redis = await getRedisClient();

      // ✅ Store session
      await redis.set(
        `session:${token}`,
        JSON.stringify({ userName }),
        { EX: 3600 } // 1 hour expiry
      );

      logger.info("✅ Token stored in Redis");

      return token;
    }

    throw new Error("No token received from Cognito");
  } catch (error: any) {
    logger.error("Login failed", { error: error.message });
    throw new Error(`AWS Error: ${error.message}`);
  }
}

// 🔹 Logout
export async function logout(token: string, logger: any) {
  if (!token) return true;

  try {
    const redis = await getRedisClient();

    await redis.del(`session:${token}`);

    logger.info("✅ Token removed from Redis");

    return true;
  } catch (error: any) {
    logger.error("Logout failed", { error: error.message });
    return false;
  }
}
