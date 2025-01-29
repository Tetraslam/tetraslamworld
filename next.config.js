/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.waifu.im', 's4.anilist.co', 'img.anili.st'],
  },
}

module.exports = nextConfig 