'use client';

import React, { useEffect, useState } from 'react';
import { getSigner, EthereumWindow } from '@/lib/web3';

export default function DashboardPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const signer = await getSigner();
        const addr = await signer.getAddress();
        setAddress(addr);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 36 }}>⏳</div>
        <div>로딩 중...</div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 className="h1">지갑 연결 필요</h1>
        <p className="lead" style={{ marginBottom: 20 }}>
          우측 상단에서 지갑을 연결하세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="h1">📊 대시보드</h1>
      
      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: 40 }}>
        {/* 주소 카드 */}
        <div className="card">
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <h2 className="h2">지갑 주소</h2>
          <div style={{ 
            padding: 12, 
            borderRadius: 8, 
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.15)',
            fontFamily: 'monospace',
            fontSize: 12,
            wordBreak: 'break-all'
          }}>
            {address}
          </div>
        </div>

        {/* 판매 통계 */}
        <div className="card">
          <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
          <h2 className="h2">판매 통계</h2>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>0 ETH</div>
          <p className="lead">아직 판매한 문서가 없습니다</p>
        </div>

        {/* 구매 통계 */}
        <div className="card">
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <h2 className="h2">구매 통계</h2>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>0개</div>
          <p className="lead">아직 구매한 문서가 없습니다</p>
        </div>
      </div>

      {/* 거래 내역 */}
      <div className="card">
        <h2 className="h2">📋 거래 내역</h2>
        <div style={{ padding: 40, textAlign: 'center', color: '#b0b8cc' }}>
          거래 내역이 없습니다
        </div>
      </div>
    </div>
  );
}