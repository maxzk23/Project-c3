import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },

  // บีบอัดผลลัพธ์ production ด้วย gzip
  compress: true,

  // เพิ่มความเร็วการโหลดรูปภาพ
  images: {
    formats: ["image/webp"],
  },

  experimental: {
    // ลดขนาด JS bundle ด้วยการ tree-shake react-icons (มีไอคอนกว่า 40,000 ตัว แต่ใช้จริงไม่กี่สิบ)
    optimizePackageImports: ["react-icons"],
    serverActions: {
      bodySizeLimit: "50mb", // เพิ่มขีดจำกัดขนาดไฟล์ในการอัปโหลดผ่าน Server Actions เป็น 50MB
    },
  },
};

export default nextConfig;
