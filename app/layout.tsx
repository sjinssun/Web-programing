import "../public/styles.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "VYNL — 음악 별점 아카이브",
  description: "좋아한 앨범을 평가하고 발견하는 음악 아카이브 VYNL"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
