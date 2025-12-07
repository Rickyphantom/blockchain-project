'use client';

import { useState, useEffect } from 'react';
import { getNFTOwner } from '@/lib/useDocuTrade';

interface NFTCertificateProps {
  tokenId: number;
  docId: number;
  title: string;
  onClose: () => void;
}

export default function NFTCertificate({ tokenId, docId, title, onClose }: NFTCertificateProps) {
  const [owner, setOwner] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNFTInfo = async () => {
      try {
        const ownerAddress = await getNFTOwner(tokenId);
        if (ownerAddress) {
          setOwner(ownerAddress);
        }
      } catch (error) {
        console.error('NFT 정보 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNFTInfo();
  }, [tokenId]);

  const downloadCertificate = () => {
    alert('증명서 다운로드 기능은 준비 중입니다! 📥');
  };

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.98), rgba(15,23,36,0.98))',
          borderRadius: 20,
          padding: 40,
          maxWidth: 600,
          width: '100%',
          border: '2px solid rgba(79,157,255,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 8,
            width: 36,
            height: 36,
            cursor: 'pointer',
            fontSize: '1.5rem',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🏆</div>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 8,
            }}
          >
            NFT 소유권 증명서
          </h2>
          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
            }}
          >
            Certificate of Ownership
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            로딩 중...
          </div>
        ) : (
          <>
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  📄 문서 제목
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#ffffff' }}>
                  {title}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  🎫 NFT Token ID
                </div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    fontFamily: 'monospace',
                  }}
                >
                  #{tokenId}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  📋 Document ID
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                  }}
                >
                  {docId}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  👤 소유자 주소
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    background: 'rgba(0,0,0,0.3)',
                    padding: 8,
                    borderRadius: 6,
                  }}
                >
                  {owner}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  📅 발행일
                </div>
                <div style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                  {new Date().toLocaleString('ko-KR')}
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(79,157,255,0.1)',
                border: '1px solid rgba(79,157,255,0.3)',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  lineHeight: 1.7,
                }}
              >
                ✅ 이 NFT는 블록체인에 영구적으로 기록되어 있습니다.<br />
                🔒 소유권은 스마트 컨트랙트로 보호됩니다.<br />
                ⛓️ Ethereum Sepolia 테스트넷에 저장됨
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-primary"
                onClick={downloadCertificate}
                style={{ flex: 1, padding: 12, fontSize: '0.95rem' }}
              >
                📥 증명서 다운로드
              </button>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  window.open(
                    `https://sepolia.etherscan.io/token/${contractAddress}?a=${tokenId}`,
                    '_blank'
                  )
                }
                style={{ flex: 1, padding: 12, fontSize: '0.95rem' }}
              >
                🔍 Etherscan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}