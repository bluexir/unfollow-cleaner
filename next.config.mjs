/** @type {import('next').NextConfig} */
const nextConfig = {
  // Eski ayarların (Resimler, TS ve ESLint yoksayma)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // YENİ EKLENEN: Uygulamanın Farcaster içinde açılmasını sağlayan güvenlik ayarları
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' blob: data: https:;
              font-src 'self';
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors https://warpcast.com https://*.farcaster.xyz;
              connect-src 'self' https://explorer-api.walletconnect.com wss://*.walletconnect.com https://api.neynar.com https://*.farcaster.xyz https://warpcast.com https://*.warpcast.com https://*.wrpcd.net https://*.privy.io https://*.rpc.privy.systems;
              block-all-mixed-content;
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
