// src/app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css'; // 전역 CSS 임포트

export const metadata: Metadata = {
  title: 'File ↔ Coin Platform',
  description: '블록체인을 사용한 전자거래 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="header">
          <div className="brand">File ↔ Coin</div>
          <nav className="nav">
            <Link href="/">홈</Link>
            <Link href="/upload">등록</Link>
            <Link href="/market">마켓</Link>
          </nav>
        </header>

        <main className="container">{children}</main>

        {/* 배경 장식 (DOM만 남기고, 스타일은 globals.css로) */}
        <div className="bgOrbs">
          <div className="orb orb1" />
          <div className="orb orb2" />
          <div className="orb orb3" />
        </div>
      </body>
    </html>
  );
}
