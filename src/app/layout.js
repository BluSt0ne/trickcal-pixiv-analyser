import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "트릭컬 픽시브 랭킹 (Trickcal Pixiv Rankings)",
  description: "트릭컬 리바이브 캐릭터들의 실시간 픽시브 투고 수 랭킹을 확인하세요.",
  referrer: 'no-referrer',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
