'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSigner, EthereumWindow } from '@/lib/web3';

export default function NavBar() {
  const path = usePathname();
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

      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts',
        params: []
      }) as string[];
      
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

        const accounts = await ethereum.request({ 
          method: 'eth_accounts',
          params: []
        }) as string[];
        
        if (accounts && accounts.length > 0) {
          const signer = await getSigner();
          const addr = await signer.getAddress();
          setAddress(addr);
          setIsConnected(true);
        }

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
    <nav style={{
      position: 'fixed',
      top: 16,
      right: 16,
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      zIndex: 60,
      background: 'linear-gradient(135deg, rgba(15,23,36,0.9), rgba(7,16,34,0.9))',
      backdropFilter: 'blur(14px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: '10px 16px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
    }}>
      {/* 홈 */}
      <Link href="/" className={`btn ${path === '/' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '13px', gap: 6 }}>
        🏠 Home
      </Link>

      {/* 마켓 */}
      <Link href="/market" className={`btn ${path === '/market' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '13px', gap: 6 }}>
        🛒 마켓
      </Link>

      {/* 등록 */}
      <Link href="/upload" className={`btn ${path === '/upload' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '13px', gap: 6 }}>
        📤 등록
      </Link>

      {/* 대시보드 */}
      <Link href="/dashboard" className={`btn ${path === '/dashboard' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '13px', gap: 6 }}>
        📊 대시보드
      </Link>

      {/* 구분선 */}
      <div style={{ width: '1px', height: 24, background: 'rgba(255,255,255,0.1)' }} />

      {/* 지갑 연결 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isConnected && address ? (
          <>
            <div style={{ 
              background: 'rgba(123,228,162,0.1)', 
              padding: '6px 10px', 
              borderRadius: 8, 
              fontSize: '12px',
              border: '1px solid rgba(123,228,162,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>✅</span>
              <span style={{ fontWeight: 600 }}>{short(address)}</span>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={disconnect} 
              style={{ padding: '6px 12px', fontSize: '12px', gap: 4 }}
            >
              🔌 연결해제
            </button>
          </>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={connect} 
            style={{ padding: '8px 14px', fontSize: '13px', gap: 6, fontWeight: 600 }}
          >
            🦊 지갑 연결
          </button>
        )}
      </div>
    </nav>
  );
}