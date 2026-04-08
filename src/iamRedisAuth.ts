
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";

export const generateRedisAuthToken = async (
  host: string,
  port: number,
  region: string
) => {
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
    query: {
      Action: "connect",
      User: "default", // Redis user
    },
    headers: {
      host: `${host}:${port}`,
    },
  };

  const signed = await signer.sign(request);

  return `${host}:${port}/?Action=connect&User=default&X-Amz-Signature=${signed.headers["authorization"]}`;
};
