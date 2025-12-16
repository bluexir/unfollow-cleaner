/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.imgur.com', 'res.cloudinary.com', 'imagedelivery.net'],
  },
  env: {
    NEXT_PUBLIC_NEYNAR_CLIENT_ID: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID,
  },
}

module.exports = nextConfig
