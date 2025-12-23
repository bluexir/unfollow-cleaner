/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Üretim ortamında tip hataları olsa bile derlemeye devam et
    ignoreBuildErrors: true,
  },
  eslint: {
    // Üretim ortamında lint hataları olsa bile derlemeye devam et
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019b4cef-2be9-2c78-95d1-11d22ab48c5b',
        permanent: false, // 307 redirect (Geçici yönlendirme)
      },
    ];
  },
};

module.exports = nextConfig;
