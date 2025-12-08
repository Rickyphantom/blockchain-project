'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
  const [isMyDocument, setIsMyDocument] = useState(false);
  const [alreadyOwns, setAlreadyOwns] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  useEffect(() => {
    if (documents.length > 0) {
      const doc = documents[0];
      setIsMyDocument(false);
      setAlreadyOwns(false);

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

        if (data && userAddress.toLowerCase() === data.seller.toLowerCase()) {
          setIsMyDocument(true); // ✅ 내 파일
        }

        // 소유 여부 확인 (구매 내역에서 확인)
        const { data: purchaseData } = await supabase
          .from('purchases')
          .select('id')
          .eq('buyer', userAddress.toLowerCase())
          .eq('doc_id', doc.doc_id)
          .maybeSingle();

        if (purchaseData) {
          setAlreadyOwns(true); // ✅ 구매한 파일
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

  const handlePurchase = async () => {
    if (!userAddress) return;

    setPurchasing(true);

    try {
      // TODO: 실제 구매 로직 구현
      console.log('구매 진행:', { docId: documents[0]?.doc_id, quantity });

      // 구매 후 문서 목록 새로고침
      await loadDocuments();
    } catch (error) {
      console.error('구매 실패:', error);
      alert('구매에 실패했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setPurchasing(false);
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
            {documents.map((document) => (
              <div
                key={document.id}
                onClick={() => handleCardClick(document.doc_id)}
                style={{
                  background:
                    'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                  borderRadius: 16,
                  padding: 24,
                  border: '1px solid rgba(79,157,255,0.2)',
                  cursor: 'pointer',
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

                {/* 판매자 */}
                <div
                  style={{
                    marginTop: 12,
                    fontSize: '0.8rem',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    opacity: 0.7,
                  }}
                >
                  👤 {short(document.seller)}
                </div>

                {/* 구매 버튼 (조건부 렌더링) */}
                {!isMyDocument &&
                  !alreadyOwns &&
                  document.is_active &&
                  document.amount > 0 &&
                  userAddress && (
                    <div
                      style={{
                        background: 'rgba(79,157,255,0.1)',
                        padding: 24,
                        borderRadius: 12,
                        border: '1px solid rgba(79,157,255,0.3)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: 16,
                          alignItems: 'end',
                          marginBottom: 16,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: '#ffffff',
                              marginBottom: 8,
                            }}
                          >
                            🔢 구매 수량
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={document.amount}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(parseInt(e.target.value) || 1)
                            }
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8,
                              color: '#ffffff',
                              fontSize: '1rem',
                            }}
                          />
                        </div>

                        <div style={{ flex: 1 }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: '#ffffff',
                              marginBottom: 8,
                            }}
                          >
                            💳 총 가격
                          </label>
                          <div
                            style={{
                              padding: '12px 16px',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(79,157,255,0.3)',
                              borderRadius: 8,
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              color: 'var(--accent)',
                            }}
                          >
                            {totalPrice} ETH
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handlePurchase}
                        disabled={purchasing}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          padding: '16px',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          cursor: purchasing ? 'not-allowed' : 'pointer',
                          opacity: purchasing ? 0.6 : 1,
                          marginBottom: 16,
                        }}
                      >
                        {purchasing ? '⏳ 구매 처리 중...' : '🛒 구매하기'}
                      </button>

                      {/* 무료 ETH 받기 안내 */}
                      <div
                        style={{
                          background: 'rgba(255,193,7,0.1)',
                          padding: 16,
                          borderRadius: 8,
                          border: '1px solid rgba(255,193,7,0.3)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: '#ffc107',
                            marginBottom: 8,
                            fontWeight: 600,
                          }}
                        >
                          💰 테스트용 ETH가 필요하신가요?
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#ffffff',
                            opacity: 0.8,
                            lineHeight: 1.6,
                          }}
                        >
                          <a
                            href="https://sepoliafaucet.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--accent)',
                              textDecoration: 'underline',
                              fontWeight: 600,
                            }}
                          >
                            Sepolia Faucet
                          </a>
                          에서 무료로 테스트 ETH를 받을 수 있습니다.
                          <br />
                          <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>
                            (Alchemy 계정 필요 / 하루 0.5 ETH 제공)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
