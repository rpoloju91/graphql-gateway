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
