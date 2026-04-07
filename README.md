npm run dev


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
