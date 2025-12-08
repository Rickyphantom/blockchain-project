'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSigner } from '@/lib/web3';
import { buyDocuments } from '@/lib/useDocuTrade';

interface Document {
  id: number;
  doc_id: number;
  title: string;
  description: string;
  seller: string;
  file_url: string;
  price_per_token: string;
  amount: number;
  is_active: boolean;
  created_at: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'sold'>('active');
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [ownedDocuments, setOwnedDocuments] = useState<Set<number>>(new Set());
  const [purchasing, setPurchasing] = useState<number | null>(null);

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

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  // 구매한 문서 목록 로드
  useEffect(() => {
    const loadOwnedDocuments = async () => {
      if (!userAddress) return;

      const { data: purchases } = await supabase
        .from('purchases')
        .select('doc_id')
        .eq('buyer', userAddress);

      if (purchases) {
        const owned = new Set(purchases.map((p) => p.doc_id));
        setOwnedDocuments(owned);
      }
    };

    loadOwnedDocuments();
  }, [userAddress]);

  useEffect(() => {
    if (documents.length > 0) {
      const doc = documents[0];

      // 내 문서 확인
      const checkMyDocument = async () => {
        if (!userAddress) return;

        const { data, error } = await supabase
          .from('documents')
          .select('seller')
          .eq('doc_id', doc.doc_id)
          .single();

        if (error) {
          console.error('문서 소유자 확인 실패:', error);
          return;
        }
      };

      checkMyDocument();
    }
  }, [userAddress, documents]);

  const loadDocuments = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.eq('is_active', true).gt('amount', 0);
      } else if (filter === 'sold') {
        query = query.eq('amount', 0);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('문서 로드 실패:', error);
      alert('문서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileUrl: string) => {
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    const icons: { [key: string]: string } = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      txt: '📃',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🎨',
      mp4: '🎬',
      avi: '🎬',
      mov: '🎬',
      mp3: '🎵',
      wav: '🎵',
      zip: '📦',
      rar: '📦',
    };
    return icons[ext || ''] || '📎';
  };

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCardClick = (docId: number) => {
    router.push(`/marketplace/${docId}`);
  };

  const handleBuyNow = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

    if (!userAddress) {
      alert('⚠️ 지갑을 먼저 연결해주세요');
      return;
    }

    if (userAddress === doc.seller.toLowerCase()) {
      alert('⚠️ 자신의 문서는 구매할 수 없습니다');
      return;
    }

    if (ownedDocuments.has(doc.doc_id)) {
      alert('⚠️ 이미 소유한 문서입니다. 대시보드에서 다운로드할 수 있습니다.');
      return;
    }

    if (doc.amount === 0) {
      alert('⚠️ 품절된 문서입니다');
      return;
    }

    try {
      setPurchasing(doc.doc_id);

      const quantity = 1;
      const basePrice = parseFloat(doc.price_per_token);
      const fee = basePrice * 0.05; // 5% 수수료
      const totalPrice = basePrice + fee;

      if (
        confirm(
          `"${doc.title}"을(를) 구매하시겠습니까?\n\n💰 가격: ${
            doc.price_per_token
          } ETH\n💳 수수료 (5%): ${fee.toFixed(
            6
          )} ETH\n━━━━━━━━━━━━━━━━\n📊 총 결제 금액: ${totalPrice.toFixed(
            6
          )} ETH`
        )
      ) {
        console.log('구매 시작:', {
          doc_id: doc.doc_id,
          quantity,
          price: doc.price_per_token,
          fee: fee.toFixed(6),
          total: totalPrice.toFixed(6),
        });

        // 블록체인에서 구매
        const txHash = await buyDocuments(
          doc.doc_id,
          quantity,
          doc.price_per_token
        );

        // Supabase에 구매 내역 저장
        const { error } = await supabase.from('purchases').insert({
          buyer: userAddress,
          doc_id: doc.doc_id,
          quantity,
          total_price: doc.price_per_token,
          tx_hash: txHash,
        });

        if (error) {
          console.error('구매 내역 저장 실패:', error);
        }

        // 구매 완료 후 소유 문서 목록 업데이트
        setOwnedDocuments((prev) => new Set([...prev, doc.doc_id]));

        alert(
          `✅ 구매 완료!\n\n📄 문서: ${
            doc.title
          }\n💰 결제 금액: ${totalPrice.toFixed(6)} ETH\n  ∟ 가격: ${
            doc.price_per_token
          } ETH\n  ∟ 수수료: ${fee.toFixed(6)} ETH\n⛓️ TX: ${txHash.slice(
            0,
            20
          )}...\n\n대시보드에서 다운로드할 수 있습니다.`
        );

        // 문서 목록 새로고침
        await loadDocuments();
      }
    } catch (error: any) {
      console.error('구매 실패:', error);
      alert(`❌ 구매 실패: ${error.message || String(error)}`);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f1724 0%, #071022 100%)',
        }}
      >
        <div style={{ fontSize: '1.2rem', color: '#ffffff' }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '80px 20px 40px',
        background: 'linear-gradient(135deg, #0f1724 0%, #071022 100%)',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              background:
                'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 16,
            }}
          >
            🏪 마켓플레이스
          </h1>
          {/* 필터 버튼 */}
          <div style={{ display: 'flex', gap: 12 }}>
            {Object.entries({
              all: '전체',
              active: '판매중',
              sold: '품절',
            }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key as 'all' | 'active' | 'sold')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background:
                    filter === key ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 문서 목록 */}
        {documents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 80,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: '1.2rem', color: '#ffffff' }}>
              등록된 파일이 없습니다
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {documents.map((document) => {
              const isMyDoc =
                userAddress &&
                document.seller.toLowerCase() === userAddress.toLowerCase();
              const isOwned = ownedDocuments.has(document.doc_id);
              const canPurchase =
                userAddress &&
                !isMyDoc &&
                !isOwned &&
                document.is_active &&
                document.amount > 0;

              return (
                <div
                  key={document.id}
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                    borderRadius: 16,
                    padding: 24,
                    border: `1px solid ${
                      isOwned ? 'rgba(123,228,162,0.3)' : 'rgba(79,157,255,0.2)'
                    }`,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = isOwned
                      ? 'rgba(123,228,162,0.5)'
                      : 'rgba(79,157,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = isOwned
                      ? 'rgba(123,228,162,0.3)'
                      : 'rgba(79,157,255,0.2)';
                  }}
                >
                  {/* 상태 배지 */}
                  <div
                    style={{
                      marginBottom: 16,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    {document.is_active && document.amount > 0 ? (
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: 12,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 'rgba(34,197,94,0.2)',
                          color: '#22c55e',
                        }}
                      >
                        ✅ 판매중
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: 12,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 'rgba(239,68,68,0.2)',
                          color: '#ef4444',
                        }}
                      >
                        ❌ 품절
                      </span>
                    )}
                    <span style={{ fontSize: '2rem' }}>
                      {getFileIcon(document.file_url)}
                    </span>
                  </div>

                  {/* 제목 */}
                  <h3
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      marginBottom: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {document.title}
                  </h3>

                  {/* 설명 */}
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: '#ffffff',
                      marginBottom: 16,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      opacity: 0.8,
                      minHeight: 45,
                    }}
                  >
                    {document.description}
                  </p>

                  {/* 정보 */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 16,
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#ffffff',
                          marginBottom: 4,
                          opacity: 0.7,
                        }}
                      >
                        💰 가격
                      </div>
                      <div
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: 'var(--accent)',
                        }}
                      >
                        {document.price_per_token} ETH
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#ffffff',
                          marginBottom: 4,
                          opacity: 0.7,
                        }}
                      >
                        🔢 남은 수량
                      </div>
                      <div
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          color: document.amount > 0 ? '#ffffff' : '#ef4444',
                        }}
                      >
                        {document.amount}개
                      </div>
                    </div>
                  </div>

                  {/* 수수료 안내 */}
                  {canPurchase && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 10,
                        background: 'rgba(79,157,255,0.1)',
                        border: '1px solid rgba(79,157,255,0.2)',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                        color: '#ffffff',
                        opacity: 0.9,
                      }}
                    >
                      💳 총 결제 금액:{' '}
                      <strong style={{ color: 'var(--accent)' }}>
                        {(parseFloat(document.price_per_token) * 1.05).toFixed(
                          6
                        )}{' '}
                        ETH
                      </strong>
                      <br />
                      <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                        (수수료 5% 포함)
                      </span>
                    </div>
                  )}

                  {/* 판매자 */}
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '0.8rem',
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>
                      👤 {short(document.seller)}
                    </span>
                    {isMyDoc && (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: 'rgba(79,157,255,0.2)',
                          color: 'var(--accent)',
                        }}
                      >
                        📝 내 문서
                      </span>
                    )}
                    {isOwned && !isMyDoc && (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: 'rgba(123,228,162,0.2)',
                          color: 'rgb(123,228,162)',
                        }}
                      >
                        ✅ 소유중
                      </span>
                    )}
                  </div>

                  {/* 구매 버튼 */}
                  <button
                    onClick={(e) => {
                      if (canPurchase) {
                        handleBuyNow(document, e);
                      } else if (!userAddress) {
                        e.stopPropagation();
                        alert('지갑을 먼저 연결해주세요');
                      } else if (isOwned) {
                        e.stopPropagation();
                        router.push('/dashboard');
                      }
                    }}
                    disabled={
                      purchasing === document.doc_id ||
                      (isMyDoc as boolean) ||
                      (!canPurchase && !isOwned)
                    }
                    className={`btn ${
                      isOwned ? 'btn-secondary' : 'btn-primary'
                    }`}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      marginTop: 16,
                      opacity:
                        purchasing === document.doc_id ||
                        (isMyDoc as boolean) ||
                        (!canPurchase && !isOwned)
                          ? 0.6
                          : 1,
                      cursor:
                        purchasing === document.doc_id ||
                        (isMyDoc as boolean) ||
                        (!canPurchase && !isOwned)
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {purchasing === document.doc_id
                      ? '⏳ 구매 중...'
                      : !userAddress
                      ? '🦊 지갑 연결 필요'
                      : isMyDoc
                      ? '📝 내 문서'
                      : isOwned
                      ? '📥 대시보드에서 다운로드'
                      : document.amount === 0
                      ? '❌ 품절'
                      : '💳 구매하기'}
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
