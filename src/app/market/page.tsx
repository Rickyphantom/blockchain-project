'use client';

import { useEffect, useState } from 'react';
import { getDocuments, savePurchase } from '@/lib/supabase';
import { buyDocuments } from '@/lib/useDocuTrade';
import { getSigner } from '@/lib/web3';
import { supabase } from '@/lib/supabase';

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

interface Purchase {
  doc_id: number;
  buyer: string;
}

export default function Market() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [userAddress, setUserAddress] = useState<string>('');
  const [ownedDocuments, setOwnedDocuments] = useState<Set<number>>(new Set());

  // 사용자 지갑 주소 가져오기
  useEffect(() => {
    const getUserAddress = async () => {
      try {
        const signer = await getSigner();
        const address = await signer.getAddress();
        setUserAddress(address.toLowerCase());
      } catch (error) {
        console.log('지갑 연결 안됨');
      }
    };
    getUserAddress();
  }, []);

  // 문서 및 구매 이력 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const docs = await getDocuments();
        setDocuments(docs);

        if (userAddress) {
          // 사용자가 구매한 문서 목록 가져오기
          const { data: purchases } = await supabase
            .from('purchases')
            .select('doc_id')
            .eq('buyer', userAddress);

          if (purchases) {
            const owned = new Set(purchases.map(p => p.doc_id));
            setOwnedDocuments(owned);
          }
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userAddress]);

  const handleBuyNow = async (doc: Document) => {
    try {
      setPurchasing(doc.doc_id);

      const signer = await getSigner();
      const buyer = await signer.getAddress();

      if (!buyer) {
        alert('⚠️ 지갑을 먼저 연결해주세요');
        return;
      }

      if (buyer.toLowerCase() === doc.seller.toLowerCase()) {
        alert('⚠️ 자신의 문서는 구매할 수 없습니다');
        return;
      }

      // 이미 구매한 문서인지 확인
      if (ownedDocuments.has(doc.doc_id)) {
        alert('⚠️ 이미 소유한 문서입니다');
        return;
      }

      const quantity = 1;

      if (confirm(`"${doc.title}"을(를) ${doc.price_per_token} ETH에 구매하시겠습니까?`)) {
        console.log('구매 시작:', { doc_id: doc.doc_id, quantity, price: doc.price_per_token });

        const txHash = await buyDocuments(doc.doc_id, quantity, doc.price_per_token);

        await savePurchase({
          buyer: buyer.toLowerCase(),
          doc_id: doc.doc_id,
          quantity,
          total_price: doc.price_per_token,
          tx_hash: txHash,
        });

        // 구매 완료 후 소유 문서 목록 업데이트
        setOwnedDocuments(prev => new Set([...prev, doc.doc_id]));

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

  // 남은 수량 계산
  const getRemainingAmount = (doc: Document) => {
    return doc.amount > 0 ? doc.amount : 0;
  };

  // 구매 가능 여부 확인
  const isPurchasable = (doc: Document) => {
    if (!userAddress) return false;
    if (ownedDocuments.has(doc.doc_id)) return false;
    if (doc.seller.toLowerCase() === userAddress) return false;
    if (getRemainingAmount(doc) === 0) return false;
    return true;
  };

  // 버튼 텍스트 결정
  const getButtonText = (doc: Document) => {
    if (purchasing === doc.doc_id) return '⏳ 구매 중...';
    if (!userAddress) return '🦊 지갑 연결 필요';
    if (ownedDocuments.has(doc.doc_id)) return '✅ 소유중';
    if (doc.seller.toLowerCase() === userAddress) return '📝 내 문서';
    if (getRemainingAmount(doc) === 0) return '❌ 품절';
    return '💳 구매하기';
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
            {documents.map((doc) => {
              const remainingAmount = getRemainingAmount(doc);
              const isOwned = ownedDocuments.has(doc.doc_id);
              const isMyDoc = userAddress && doc.seller.toLowerCase() === userAddress;
              const canPurchase = isPurchasable(doc);

              return (
                <div
                  key={doc.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                    borderRadius: 16,
                    padding: 24,
                    border: `1px solid ${isOwned ? 'rgba(123,228,162,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = isOwned 
                      ? 'rgba(123,228,162,0.5)' 
                      : 'rgba(79,157,255,0.3)';
                    e.currentTarget.style.boxShadow = '0 12px 48px rgba(79,157,255,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = isOwned 
                      ? 'rgba(123,228,162,0.3)' 
                      : 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                  }}
                >
                  {/* 소유중 배지 */}
                  {isOwned && (
                    <div style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      background: 'rgba(123,228,162,0.2)',
                      border: '1px solid rgba(123,228,162,0.4)',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'rgb(123,228,162)',
                    }}>
                      ✅ 소유중
                    </div>
                  )}

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
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>남은 수량</span>
                      <span style={{ 
                        color: remainingAmount > 0 ? 'var(--text-primary)' : '#ef4444', 
                        fontWeight: 600 
                      }}>
                        {remainingAmount}개
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>판매자</span>
                      <span style={{
                        color: isMyDoc ? 'var(--accent)' : 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace',
                        fontWeight: isMyDoc ? 600 : 400,
                      }}>
                        {isMyDoc ? '나' : `${doc.seller.slice(0, 6)}...${doc.seller.slice(-4)}`}
                      </span>
                    </div>
                  </div>

                  <button
                    className={`btn ${isOwned ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => canPurchase && handleBuyNow(doc)}
                    disabled={!canPurchase || purchasing === doc.doc_id}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      opacity: (!canPurchase || purchasing === doc.doc_id) ? 0.6 : 1,
                      cursor: (!canPurchase || purchasing === doc.doc_id) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {getButtonText(doc)}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
