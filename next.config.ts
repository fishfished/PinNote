import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. 核心：开启静态导出模式，这会生成 Tauri 需要的 ../out 文件夹
  output: "export", 
  
  images: {
    unoptimized: true,
  },
  
  // 保持你原来的开发配置不变
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
  ],
};

export default nextConfig;