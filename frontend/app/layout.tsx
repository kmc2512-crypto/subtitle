import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "自動字幕付け Webアプリ",
  description: "動画をアップロードしてローカルで自動文字起こしし、字幕付き動画を書き出すツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
