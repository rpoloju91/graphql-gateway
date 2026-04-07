npm run dev
npm install @aws-sdk/client-cognito-identity-provider

import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto"; 

export async function login(userName: string, password: string, logger: any) {
  const clientId = "";
  const clientSecret = ""; // Your FULL secret
  const region = "eu-north-1"; 

  // 1. Calculate the Secret Hash
  const secretHash = createHmac('sha256', clientSecret)
    .update(userName + clientId)
    .digest('base64');

  // 2. Initialize the AWS Client
  const client = new CognitoIdentityProviderClient({ region });

  // 3. Configure the direct login request
  const command = new InitiateAuthCommand({
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: {
      USERNAME: userName,
      PASSWORD: password,
      SECRET_HASH: secretHash,
    },
  });

  try {
    logger.info("Calling AWS SDK InitiateAuth...");
    
    // 4. Send the request
    const response = await client.send(command);
    
    // Return the token!
    return response.AuthenticationResult?.AccessToken;

  } catch (error: any) {
    logger.error("Cognito login rejected", { error: error.message });
    throw new Error("Invalid username or password");
  }
}




=----------------------------

Mutation: {
    login: async (_: any, { userName, password }: any, ctx: any) => {
      ctx.logger.info("Logging user", { userName });
      const token = await login(userName, password, ctx.logger);
      ctx.logger.info("Login success");
      return { token };
    },
  },

  --------------------------


  import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { CognitoIdentityProviderClient, GlobalSignOutCommand } from "@aws-sdk/client-cognito-identity-provider";

const USER_POOL_ID = "eu-north-1_qkvWQ8LIf"; // e.g., eu-north-1_XXXXXXX
const CLIENT_ID = "4akdrbbrdjh6corela3nmq1s47";
const REGION = "eu-north-1_qkvWQ8LIf";

export async function login(userName: string, password: string, logger: any) {
  const userPool = new CognitoUserPool({ UserPoolId: USER_POOL_ID, ClientId: CLIENT_ID });
  const authenticationDetails = new AuthenticationDetails({ Username: userName, Password: password });
  const cognitoUser = new CognitoUser({ Username: userName, Pool: userPool });

  return new Promise((resolve, reject) => {
    logger.info("Calling AWS Cognito via Secure Remote Password (SRP) flow...");
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => resolve(result.getAccessToken().getJwtToken()),
      onFailure: (err) => {
        logger.error("Cognito SRP login rejected", { error: err.message });
        reject(new Error("Invalid username or password"));
      },
    });
  });
}

export async function logout(accessToken: string, logger: any) {
  if (!accessToken) return true;
  const client = new CognitoIdentityProviderClient({ region: REGION });
  try {
    logger.info("Revoking token in AWS...");
    await client.send(new GlobalSignOutCommand({ AccessToken: accessToken }));
    return true;
  } catch (error: any) {
    logger.error("Cognito logout failed", { error: error.message });
    return true; // Return true so frontend clears state regardless
  }
}


------------------------------

npm install amazon-cognito-identity-js

npm install amazon-cognito-identity-js @aws-sdk/client-cognito-identity-provider


--------------------------------------





import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";

export async function login(userName: string, password: string, logger: any) {
  // Your enterprise credentials
  const clientId = "3bglevsacrbnig7b3j5d6ej401";
  const clientSecret = "1fi5j89ttm34st43baa6nuhn9v9g97922bkqt4b5pk5l95ueecf5";
  const region = "eu-north-1"; 

  // Calculate the Secret Hash
  const secretHash = createHmac('sha256', clientSecret)
    .update(userName + clientId)
    .digest('base64');

  const client = new CognitoIdentityProviderClient({ region });

  try {
    logger.info("Initiating Choice-based USER_AUTH flow with upfront password...");
    
    const initCommand = new InitiateAuthCommand({
      AuthFlow: "USER_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: userName,
        PREFERRED_CHALLENGE: "PASSWORD",
        PASSWORD: password, // <-- AWS was screaming because this was missing!
        SECRET_HASH: secretHash,
      },
    });

    // Send the single request
    const response = await client.send(initCommand);

    // Because we sent the password upfront, AWS will just log us in immediately
    if (response.AuthenticationResult?.AccessToken) {
      logger.info("Login Successful!");
      return response.AuthenticationResult.AccessToken;
    } 
    
    // Safety net: Just in case your user account has MFA turned on
    if (response.ChallengeName) {
      throw new Error(`AWS wants another step: ${response.ChallengeName}`);
    }

    throw new Error("AWS did not return a token.");

  } catch (error: any) {
    logger.error("Cognito login rejected", { error: error.message });
    throw new Error(`AWS Error: ${error.message}`); 
  }
}
-----------------------------------------------------------
redis -redisClient.ts
----------------------
// src/redisClient.ts
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL,
  pingInterval: 1000 * 60 * 3, // Ping every 3 minutes to keep the connection alive
}); 

redisClient.on('error', (err) => console.error('Remote Redis Error:', err));
redisClient.on('connect', () => console.log('Successfully connected to Remote Redis!'));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}


-----------------------------------

// src/redisClient.ts
import { createClient } from 'redis';

// If you are using a remote Redis server, pass the URL here.
// Example: { url: 'redis://alice:foobared@awesome.redis.server:6380' }
export const redisClient = createClient(); 

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Successfully connected to Redis'));

// A helper to ensure we are connected before we query
export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

----------------------------------

// src/service/authService.ts
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";
import { redisClient } from "../redisClient"; // <-- Import Redis

const clientId = "3bglevsacrbnig7b3j5d6ej401";
const clientSecret = "1fi5j89ttm34st43baa6nuhn9v9g97922bkqt4b5pk5l95ueecf5";
const region = "eu-north-1"; 

export async function login(userName: string, password: string, logger: any) {
  const secretHash = createHmac('sha256', clientSecret).update(userName + clientId).digest('base64');
  const client = new CognitoIdentityProviderClient({ region });

  try {
    const initCommand = new InitiateAuthCommand({
      AuthFlow: "USER_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: userName,
        PREFERRED_CHALLENGE: "PASSWORD",
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    });

    const response = await client.send(initCommand);

    if (response.AuthenticationResult?.AccessToken) {
      const token = response.AuthenticationResult.AccessToken;
      
      // 👇 NEW REDIS LOGIC: Save the token as a valid session 👇
      // Key: `session:{token}`, Value: The user's email, Expire: 3600 seconds (1 hr)
      await redisClient.setEx(`session:${token}`, 3600, userName);
      logger.info("Token successfully cached in Redis");

      return token;
    } 

    throw new Error("AWS did not return a token.");
  } catch (error: any) {
    throw new Error(`AWS Error: ${error.message}`); 
  }
}

export async function logout(token: string, logger: any) {
  if (!token) return true;
  try {
    // 👇 NEW REDIS LOGIC: Instantly delete the token from Redis 👇
    await redisClient.del(`session:${token}`);
    logger.info("Token successfully revoked from Redis");
    return true;
  } catch (error: any) {
    logger.error("Redis logout failed", { error: error.message });
    return false;
  }
}
-------------------------------------------

// src/index.ts (or your server setup file)
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import typeDefs from './schema/user/typeDefs';
import resolvers from './schema/user/resolvers';
import { connectRedis, redisClient } from './redisClient'; // <-- Import Redis

// Ensure Redis starts up when your server starts
await connectRedis();

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => {
    // 1. Extract the token from the frontend React headers
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    // 2. Default context variables
    const ctx: any = {
      logger: console, // Replace with your actual logger
      token: null,
      userName: null,
    };

    // 3. The Redis Gatekeeper Check
    if (token) {
      // Check if the token exists in Redis
      const cachedUser = await redisClient.get(`session:${token}`);
      
      if (cachedUser) {
        // Token is valid! Pass it to the resolvers
        ctx.token = token;
        ctx.userName = cachedUser; 
      } else {
        // Token was deleted (logged out) or expired. 
        // We do NOT pass the token to the context. 
        console.warn("Rejected invalid or expired token via Redis");
      }
    }

    return ctx;
  },
});

console.log(`🚀 Server ready at ${url}`);

-----------------------------
// src/schema/user/resolvers.ts
import { login, logout } from "../../service/authService";
import { sayHello } from "../../service/helloService";

export default {
  Query: {
    hello: async (_: any, { type }: any, ctx: any) => {
      // If Redis didn't find the token, block the request immediately!
      if (!ctx.token) {
        throw new Error("Unauthorized: Invalid or expired session");
      }

      ctx.logger.info(`Executing Query: Hello for user ${ctx.userName}`);
      const response = await sayHello(type, ctx.token, ctx.logger);
      return JSON.stringify(response);
    },
  },
  Mutation: {
    // ... login remains the same
    logout: async (_: any, __: any, ctx: any) => {
      // Pass the token to the logout service to delete it from Redis
      return await logout(ctx.token, ctx.logger);
    },
  }
};
------------------------------------------------------

