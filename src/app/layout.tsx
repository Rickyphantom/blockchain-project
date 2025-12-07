// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AppStateProvider } from '@/context/AppState';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'File ↔ Coin Platform',
  description: '블록체인을 사용한 전자거래 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppStateProvider>
          <NavBar />
          <div style={{ paddingTop: 20 }}>
            <div className="app-container">{children}</div>
          </div>
        </AppStateProvider>
      </body>
    </html>
  );
}
