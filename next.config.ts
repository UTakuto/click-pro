import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "example.com",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "3004",
            },
            // その他の外部画像ホストを追加する場合はここに追加
            {
                protocol: "https",
                hostname: "**", // 開発環境用（本番では具体的なホスト名を指定することを推奨）
            },
        ],
    },
};

export default nextConfig;
