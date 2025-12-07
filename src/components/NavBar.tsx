'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/context/AppState';

export default function NavBar() {
  const path = usePathname();
  const { cart } = useAppState();

  return (
    <nav style={{
      position: 'fixed',
      top: 18,
      right: 18,
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      zIndex: 60,
    }}>
      <Link href="/" className={`btn ${path === '/' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px' }}>
        🏠 Home
      </Link>
      <Link href="/upload" className={`btn ${path === '/upload' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px' }}>
        ➕ 등록
      </Link>
      <Link href="/market" className={`btn ${path === '/market' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px' }}>
        🛒 마켓
      </Link>

      <div style={{ minWidth: 36, textAlign: 'center' }}>
        <div title="장바구니">
          {cart.length > 0 ? <span style={{ fontWeight: 700 }}>{cart.length}</span> : <span className="tag">0</span>}
        </div>
      </div>
    </nav>
  );
}