import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // เพิ่มขีดจำกัดขนาดไฟล์ในการอัปโหลดผ่าน Server Actions เป็น 50MB
    },
  },
};

export default nextConfig;
