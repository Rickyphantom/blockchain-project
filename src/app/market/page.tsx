'use client';

import { useEffect, useState } from 'react';
import { getDocuments } from '@/lib/supabase';
import { useAppState } from '@/context/AppState';
import { buyDocuments } from '@/lib/useDocuTrade';
import { getSigner } from '@/lib/web3';

interface Document {
  id: number;
  doc_id: number;
  title: string;
  seller: string;
  file_url: string;
  description: string;
  price_per_token: string;
  amount: number;
  created_at: string;
}

export default function Market() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const { addToCart, cart } = useAppState();

  useEffect(() => {
    (async () => {
      try {
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error('문서 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAddToCart = (doc: Document) => {
    const isAlreadyInCart = cart.some((item) => item.doc_id === doc.doc_id);
    if (isAlreadyInCart) {
      alert('이미 장바구니에 있습니다');
      return;
    }
    addToCart({
      doc_id: doc.doc_id,
      title: doc.title,
      seller: doc.seller,
      price_per_token: doc.price_per_token,
      amount: doc.amount,
      quantity: 1,
    });
    alert('✅ 장바구니에 추가되었습니다');
  };

  const handleBuyNow = async (doc: Document) => {
    try {
      setPurchasing(doc.doc_id);

      // 지갑 연결 확인
      const signer = await getSigner();
      const buyer = await signer.getAddress();

      if (!buyer) {
        alert('⚠️ 지갑을 먼저 연결해주세요');
        return;
      }

      // 판매자와 구매자가 같은지 확인
      if (buyer.toLowerCase() === doc.seller.toLowerCase()) {
        alert('⚠️ 자신의 문서는 구매할 수 없습니다');
        return;
      }

      const quantity = 1; // 기본 1개 구매

      if (confirm(`"${doc.title}"을(를) ${doc.price_per_token} ETH에 구매하시겠습니까?`)) {
        console.log('구매 시작:', { doc_id: doc.doc_id, quantity, price: doc.price_per_token });

        const txHash = await buyDocuments(doc.doc_id, quantity, doc.price_per_token);

        alert(`✅ 구매 완료!\n\n📄 문서: ${doc.title}\n⛓️ TX: ${txHash.slice(0, 20)}...`);

        // 문서 목록 새로고침
        const updatedDocs = await getDocuments();
        setDocuments(updatedDocs);
      }
    } catch (error) {
      console.error('구매 실패:', error);
      alert(`❌ 구매 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f1724 0%, #071022 100%)',
      }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '80px 20px 40px',
      background: 'linear-gradient(135deg, #0f1724 0%, #071022 100%)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          marginBottom: 40,
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          📚 문서 마켓플레이스
        </h1>

        {documents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
              등록된 문서가 없습니다
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                  borderRadius: 16,
                  padding: 24,
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(79,157,255,0.3)';
                  e.currentTarget.style.boxShadow = '0 12px 48px rgba(79,157,255,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    📄
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      marginBottom: 4,
                      color: 'var(--text-primary)',
                    }}>
                      {doc.title}
                    </h3>
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                    }}>
                      ID: {doc.doc_id}
                    </div>
                  </div>
                </div>

                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                  lineHeight: 1.6,
                  minHeight: 48,
                }}>
                  {doc.description}
                </p>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginBottom: 16,
                  padding: 12,
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>가격</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      {doc.price_per_token} ETH
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>수량</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {doc.amount}개
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>판매자</span>
                    <span style={{
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}>
                      {doc.seller.slice(0, 6)}...{doc.seller.slice(-4)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleBuyNow(doc)}
                    disabled={purchasing === doc.doc_id}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      opacity: purchasing === doc.doc_id ? 0.6 : 1,
                    }}
                  >
                    {purchasing === doc.doc_id ? '⏳ 구매 중...' : '💳 구매하기'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleAddToCart(doc)}
                    disabled={purchasing === doc.doc_id}
                    style={{
                      padding: '12px 16px',
                      fontSize: '0.95rem',
                    }}
                  >
                    🛒
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
