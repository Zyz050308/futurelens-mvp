import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FutureLens - AI时代的个人未来影响系统",
  description: "今天有哪些AI事件正在改变你的未来？",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
