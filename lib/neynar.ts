import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY ortam değişkeni eksik!");
}

const rawConfig = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
});

const visibleConfig = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
  baseOptions: {
    headers: {
      "x-neynar-experimental": "true",
    },
  },
});

export const neynarClientRaw = new NeynarAPIClient(rawConfig);
export const neynarClientVisible = new NeynarAPIClient(visibleConfig);
export const neynarClient = neynarClientVisible;
