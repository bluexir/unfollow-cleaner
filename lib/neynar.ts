import { NeynarAPIClient } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY ortam değişkeni eksik!");
}

export const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
