import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const isCapacitor = process.env.BUILD_TARGET === "capacitor";

const nextConfig: NextConfig = {
  // Static export for Capacitor APK build
  ...(isCapacitor && { output: "export", trailingSlash: true }),
  turbopack: {},
  images: {
    // unoptimized needed for static export (Capacitor)
    unoptimized: isCapacitor,
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  allowedDevOrigins: [
    "192.168.1.9",
    "192.168.0.*",
    "192.168.1.*",
    "10.0.0.*",
    "172.16.*.*",
  ],
  async headers() {
    if (isCapacitor) return []; // Capacitor doesn't need HTTP headers
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com;",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
