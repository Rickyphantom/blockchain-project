'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getSigner, EthereumWindow } from '@/lib/web3';
import { ethers } from 'ethers';

export default function NavBar() {
  const path = usePathname();
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState<string>('0');

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getBalance = async (addr: string) => {
    try {
      console.log('💳 잔액 조회 중... 주소:', addr);
      const signer = await getSigner();
      const provider = signer.provider;

      if (!provider) {
        console.error('Provider를 찾을 수 없습니다.');
        setBalance('0');
        return;
      }

      // Sepolia 네트워크 확인 (chainId: 11155111)
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      console.log(
        '🌐 현재 네트워크:',
        network.name,
        '(chainId:',
        chainId + ')'
      );

      if (chainId !== 11155111) {
        console.error(
          '❌ Sepolia 테스트넷이 아닙니다. Sepolia로 전환해주세요.'
        );
        setBalance('0');
        return;
      }

      const balanceWei = await provider.getBalance(addr);
      const balanceEth = ethers.formatEther(balanceWei);
      console.log('잔액:', balanceEth, 'SepoliaETH');

      setBalance(parseFloat(balanceEth).toFixed(4));
    } catch (error) {
      console.error('잔액 조회 실패:', error);
      setBalance('0');
    }
  };

  const connect = async () => {
    try {
      const ethereum = (window as EthereumWindow).ethereum;
      if (!ethereum) {
        alert('MetaMask가 필요합니다');
        return;
      }

      const accounts = (await ethereum.request({
        method: 'eth_requestAccounts',
        params: [],
      })) as string[];

      if (accounts && accounts.length > 0) {
        const signer = await getSigner();
        const addr = await signer.getAddress();
        setAddress(addr);
        setIsConnected(true);
        await getBalance(addr);
      }
    } catch (e) {
      console.error('connect error', e);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    setBalance('0');
  };

  useEffect(() => {
    (async () => {
      try {
        const ethereum = (window as EthereumWindow).ethereum;
        if (!ethereum) return;

        const accounts = (await ethereum.request({
          method: 'eth_accounts',
          params: [],
        })) as string[];

        if (accounts && accounts.length > 0) {
          const signer = await getSigner();
          const addr = await signer.getAddress();
          setAddress(addr);
          setIsConnected(true);
          await getBalance(addr);
        }

        ethereum.on?.('accountsChanged', async (accs: unknown) => {
          const accounts = accs as string[];
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            await getBalance(accounts[0]);
          } else {
            setAddress(null);
            setIsConnected(false);
            setBalance('0');
          }
        });
      } catch (e) {
        console.error('ethereum check error', e);
      }
    })();
  }, []);

  // 주기적으로 잔액 업데이트 (선택사항)
  useEffect(() => {
    if (address && isConnected) {
      const interval = setInterval(() => {
        getBalance(address);
      }, 10000); // 10초마다 업데이트

      return () => clearInterval(interval);
    }
  }, [address, isConnected]);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        zIndex: 60,
        background:
          'linear-gradient(135deg, rgba(15,23,36,0.9), rgba(7,16,34,0.9))',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '10px 16px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* 홈 */}
      <Link
        href="/"
        className={`btn ${path === '/' ? 'btn-primary' : 'btn-secondary'}`}
        style={{ padding: '8px 12px', fontSize: '13px', gap: 6 }}
      >
        🏠 Home
      </Link>

      {/* 마켓 */}
      <Link
        href="/market"
        className={`btn ${
          path === '/market' ? 'btn-primary' : 'btn-secondary'
        }`}
        style={{ padding: '8px 12px', fontSize: '13px', gap: 6 }}
      >
        🛒 마켓
      </Link>

      {/* 등록 */}
      <Link
        href="/upload"
        className={`btn ${
          path === '/upload' ? 'btn-primary' : 'btn-secondary'
        }`}
        style={{ padding: '8px 12px', fontSize: '13px', gap: 6 }}
      >
        📤 등록
      </Link>

      {/* 대시보드 */}
      <Link
        href="/dashboard"
        className={`btn ${
          path === '/dashboard' ? 'btn-primary' : 'btn-secondary'
        }`}
        style={{ padding: '8px 12px', fontSize: '13px', gap: 6 }}
      >
        📊 대시보드
      </Link>

      {/* 구분선 */}
      <div
        style={{
          width: '1px',
          height: 24,
          background: 'rgba(255,255,255,0.1)',
        }}
      />

      {/* 지갑 연결 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isConnected && address ? (
          <>
            {/* 잔액 표시 */}
            <div
              style={{
                background: 'rgba(79,157,255,0.1)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '12px',
                border: '1px solid rgba(79,157,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
              }}
            >
              <span>💰</span>
              <span style={{ color: 'var(--accent)' }}>{balance} ETH</span>
            </div>

            {/* 주소 표시 */}
            <div
              style={{
                background: 'rgba(123,228,162,0.1)',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: '12px',
                border: '1px solid rgba(123,228,162,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>✅</span>
              <span style={{ fontWeight: 600 }}>{short(address)}</span>
            </div>

            {/* 연결 해제 버튼 */}
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
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              gap: 6,
              fontWeight: 600,
            }}
          >
            🦊 지갑 연결
          </button>
        )}
      </div>
    </nav>
  );
}
