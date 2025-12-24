import { NeynarAPIClient } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY ortam değişkeni eksik!");
}

// Bu istemci SADECE sunucu tarafında (API dosyalarında) kullanılmalıdır.
export const neynarClient = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY,
});
