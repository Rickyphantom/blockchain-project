// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ConnectCard from '@/components/ConnectCard';
import { hasMetaMask, ensureSepolia, getSigner } from '@/lib/web3';

export default function Page() {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      if (hasMetaMask()) {
        const signer = await getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
        setConnected(true);
      }
    } catch (error) {
      setConnected(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      
      // Sepolia 네트워크 확인
      await ensureSepolia();
      
      // 지갑 연결
      const signer = await getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
      setConnected(true);
      
      alert(`✅ 연결 성공!\n\n지갑: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (error) {
      alert(`❌ 연결 실패: ${error instanceof Error ? error.message : String(error)}`);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setUserAddress('');
    alert('지갑 연결이 해제되었습니다');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* 헤더/네비게이션 */}
      <nav
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
          📚 DocuTrade
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>
            홈
          </Link>
          <Link
            href="/market"
            style={{ textDecoration: 'none', color: '#666', transition: 'color 0.3s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#007bff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
          >
            마켓
          </Link>
          <Link
            href="/upload"
            style={{ textDecoration: 'none', color: '#666', transition: 'color 0.3s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#007bff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
          >
            업로드
          </Link>
          <Link
            href="/dashboard"
            style={{ textDecoration: 'none', color: '#666', transition: 'color 0.3s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#007bff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
          >
            대시보드
          </Link>

          {connected ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div
                style={{
                  backgroundColor: '#e8f5e9',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: '#2e7d32',
                  fontWeight: 'bold',
                }}
              >
                ✅ {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </div>
              <button
                onClick={handleDisconnect}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                연결 해제
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              {loading ? '연결 중...' : '🦊 지갑 연결'}
            </button>
          )}
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        {/* 히어로 섹션 */}
        <section
          style={{
            textAlign: 'center',
            marginBottom: '60px',
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#333',
            }}
          >
            📄 문서 블록체인 거래소
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: '#666',
              marginBottom: '30px',
              lineHeight: '1.6',
            }}
          >
            스마트 컨트랙트로 안전하게 문서를 거래하세요.
            <br />
            투명하고 신뢰할 수 있는 P2P 문서 마켓플레이스
          </p>

          {connected ? (
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <Link href="/market">
                <button
                  style={{
                    padding: '15px 40px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  🛍️ 마켓 보기
                </button>
              </Link>
              <Link href="/upload">
                <button
                  style={{
                    padding: '15px 40px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  📤 문서 등록
                </button>
              </Link>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              style={{
                padding: '15px 40px',
                backgroundColor: loading ? '#ccc' : '#ffc107',
                color: '#333',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '연결 중...' : '🦊 MetaMask로 시작하기'}
            </button>
          )}
        </section>

        {/* 기능 소개 */}
        <section style={{ marginBottom: '60px' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '40px',
              color: '#333',
            }}
          >
            ✨ 주요 기능
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '30px',
            }}
          >
            {/* 카드 1 */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔐</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                안전한 거래
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                스마트 컨트랙트로 자동 검증된 거래. 중개자 없이 안전하게 문서를 거래하세요.
              </p>
            </div>

            {/* 카드 2 */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>⛓️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                블록체인 기반
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                모든 거래는 블록체인에 기록되어 투명성과 추적성을 보장합니다.
              </p>
            </div>

            {/* 카드 3 */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>💰</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                저렴한 수수료
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                가스비만 지불하면 됩니다. 중간 수수료가 없습니다.
              </p>
            </div>

            {/* 카드 4 */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>🌍</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                글로벌 거래
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                전 세계 어디서나 누구나 문서를 거래할 수 있습니다.
              </p>
            </div>

            {/* 카드 5 */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>📊</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                대시보드
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                거래 내역, 수익, 구매 기록을 한눈에 관리하세요.
              </p>
            </div>

            {/* 카드 6 */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔍</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                쉬운 검색
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                제목과 설명으로 원하는 문서를 쉽게 찾을 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 시작하기 */}
        <section
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '50px',
            borderRadius: '10px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>
            🚀 지금 시작하세요!
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '30px', lineHeight: '1.6' }}>
            MetaMask 지갑을 연결하고 문서 거래를 시작하세요.
            <br />
            복잡한 회원가입은 필요 없습니다.
          </p>

          {!connected && (
            <button
              onClick={handleConnect}
              disabled={loading}
              style={{
                padding: '15px 40px',
                backgroundColor: '#fff',
                color: '#007bff',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '연결 중...' : '🦊 지갑 연결하기'}
            </button>
          )}
        </section>
      </main>

      {/* 푸터 */}
      <footer
        style={{
          backgroundColor: '#333',
          color: 'white',
          padding: '30px 20px',
          textAlign: 'center',
          marginTop: '60px',
        }}
      >
        <p style={{ marginBottom: '10px' }}>
          © 2025 DocuTrade. 블록체인 기반 문서 거래소
        </p>
        <p style={{ fontSize: '12px', color: '#aaa' }}>
          Ethereum Sepolia Testnet에서 운영 중입니다.
        </p>
      </footer>
    </div>
  );
}
