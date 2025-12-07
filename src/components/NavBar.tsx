'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/context/AppState';
import { getSigner, EthereumWindow } from '@/lib/web3';

export default function NavBar() {
  const path = usePathname();
  const { cart } = useAppState();
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const connect = async () => {
    try {
      const ethereum = (window as EthereumWindow).ethereum;
      if (!ethereum) {
        alert('MetaMask가 필요합니다');
        return;
      }

      const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      if (accounts && accounts.length > 0) {
        const signer = await getSigner();
        const addr = await signer.getAddress();
        setAddress(addr);
        setIsConnected(true);
      }
    } catch (e) {
      console.error('connect error', e);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const ethereum = (window as EthereumWindow).ethereum;
        if (!ethereum) return;

        const accounts = (await ethereum.request({ method: 'eth_accounts' })) as string[];
        if (accounts && accounts.length > 0) {
          const signer = await getSigner();
          const addr = await signer.getAddress();
          setAddress(addr);
          setIsConnected(true);
        }

        // 계정 변경 리스너
        ethereum.on?.('accountsChanged', (accs: unknown) => {
          const accounts = accs as string[];
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setAddress(null);
            setIsConnected(false);
          }
        });
      } catch (e) {
        console.error('ethereum check error', e);
      }
    })();
  }, []);

  return (
    <nav style={{ position: 'fixed', top: 18, right: 18, display: 'flex', gap: 10, alignItems: 'center', zIndex: 60 }}>
      <Link href="/" className={`btn ${path === '/' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px' }}>
        🏠 Home
      </Link>

      <Link href="/market" className={`btn ${path === '/market' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px' }}>
        🛒 마켓
      </Link>

      <Link href="/upload" className={`btn ${path === '/upload' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px' }}>
        ➕ 등록
      </Link>

      <Link href="/dashboard" className={`btn ${path === '/dashboard' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px' }}>
        📊 대시보드
      </Link>

      <div style={{ minWidth: 44, textAlign: 'center' }}>
        <div className="tag">장바구니</div>
        <div style={{ fontWeight: 700 }}>{cart.length}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isConnected && address ? (
          <>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 8, fontSize: 13 }}>
              {short(address)}
            </div>
            <button className="btn btn-secondary" onClick={disconnect} style={{ padding: '6px 10px' }}>
              연결 해제
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={connect} style={{ padding: '6px 10px' }}>
            지갑 연결
          </button>
        )}
      </div>
    </nav>
  );
}