import { NeynarAPIClient } from '@neynar/nodejs-sdk';

if (!process.env.NEYNAR_API_KEY) {
  throw new Error('NEYNAR_API_KEY is not set');
}

export const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

// Constants
export const REQUIRED_FOLLOW_FID = 429973; // @bluexir FID
export const REQUIRED_FOLLOW_USERNAME = 'bluexir';
