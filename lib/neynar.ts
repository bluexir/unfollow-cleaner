import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY ortam değişkeni eksik!");
}

export const neynarClientRaw = new NeynarAPIClient(
  new Configuration({
    apiKey: process.env.NEYNAR_API_KEY,
  })
);

export const neynarClientVisible = new NeynarAPIClient(
  new Configuration({
    apiKey: process.env.NEYNAR_API_KEY,
    baseOptions: {
      headers: {
        "x-neynar-experimental": "true",
      },
    },
  })
);
