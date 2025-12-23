/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        // Görseldeki ID'ye göre güncellenmiş yönlendirme adresi
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019b4cef-2be9-2c78-95d1-11d22ab48c5b',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
