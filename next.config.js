/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.waifu.im',
      },
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'img.anili.st',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co', // Spotify album art
      },
    ],
  },
}

module.exports = nextConfig 