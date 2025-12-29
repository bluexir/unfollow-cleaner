import { NeynarAPIClient } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY ortam değişkeni eksik!");
}

// Neynar SDK constructor imzası: new NeynarAPIClient(apiKey, options?)
export const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
