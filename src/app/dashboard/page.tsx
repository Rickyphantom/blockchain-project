'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSigner } from '@/lib/web3';

interface Purchase {
  id: number;
  doc_id: number;
  buyer: string;
  quantity: number;
  total_price: string;
  tx_hash: string;
  created_at: string;
  documents: {
    title: string;
    description: string;
    seller: string;
  };
}

interface SoldDocument {
  id: number;
  doc_id: number;
  title: string;
  description: string;
  price_per_token: string;
  amount: number;
  seller: string;
  created_at: string;
}

export default function Dashboard() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [soldDocs, setSoldDocs] = useState<SoldDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const signer = await getSigner();
        const address = await signer.getAddress();
        setUserAddress(address.toLowerCase());

        // 구매한 문서 가져오기
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases')
          .select(`
            *,
            documents (
              title,
              description,
              seller
            )
          `)
          .eq('buyer', address.toLowerCase())
          .order('created_at', { ascending: false });

        if (purchaseError) {
          console.error('구매 목록 로드 실패:', purchaseError);
        } else {
          setPurchases(purchaseData || []);
        }

        // 판매 중인 문서 가져오기
        const { data: salesData, error: salesError } = await supabase
          .from('documents')
          .select('*')
          .eq('seller', address.toLowerCase())
          .order('created_at', { ascending: false });

        if (salesError) {
          console.error('판매 목록 로드 실패:', salesError);
        } else {
          setSoldDocs(salesData || []);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        alert('⚠️ 지갑을 먼저 연결해주세요');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDelete = async (docId: number, documentId: number) => {
    if (!confirm('정말로 이 문서를 삭제하시겠습니까?\n\n⚠️ 이미 판매된 내역은 삭제되지 않습니다.')) {
      return;
    }

    try {
      setDeleting(documentId);

      // documents 테이블에서 삭제
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('seller', userAddress);

      if (error) {
        throw error;
      }

      // 삭제 성공 시 목록에서 제거
      setSoldDocs(prev => prev.filter(doc => doc.id !== documentId));
      alert('✅ 문서가 삭제되었습니다');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert(`❌ 삭제 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDeleting(null);
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
          📊 대시보드
        </h1>

        {/* 사용자 정보 */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '2rem' }}>👤</div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                내 지갑 주소
              </div>
              <div style={{ 
                fontSize: '1rem', 
                fontFamily: 'monospace', 
                color: 'var(--accent)',
                fontWeight: 600,
              }}>
                {userAddress}
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div style={{
          display: 'flex',
          gap: 16,
          marginBottom: 32,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <button
            onClick={() => setActiveTab('purchases')}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'purchases' ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeTab === 'purchases' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            💳 구매 목록 ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'sales' ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeTab === 'sales' ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            📤 판매 목록 ({soldDocs.length})
          </button>
        </div>

        {/* 구매 목록 탭 */}
        {activeTab === 'purchases' && (
          <>
            {purchases.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 60,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                  구매한 문서가 없습니다
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 24,
              }}>
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
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
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
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
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                      }}>
                        ✅
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          marginBottom: 4,
                          color: 'var(--text-primary)',
                        }}>
                          {purchase.documents?.title || '제목 없음'}
                        </h3>
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                        }}>
                          Doc ID: {purchase.doc_id}
                        </div>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '0.95rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 16,
                      lineHeight: 1.6,
                    }}>
                      {purchase.documents?.description || '설명 없음'}
                    </p>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      padding: 12,
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 8,
                      marginBottom: 12,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>구매 가격</span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>
                          {purchase.total_price} ETH
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>수량</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {purchase.quantity}개
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>판매자</span>
                        <span style={{
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem',
                          fontFamily: 'monospace',
                        }}>
                          {purchase.documents?.seller ? 
                            `${purchase.documents.seller.slice(0, 6)}...${purchase.documents.seller.slice(-4)}` 
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      padding: 8,
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 6,
                    }}>
                      <div style={{ marginBottom: 4 }}>
                        📅 구매일: {new Date(purchase.created_at).toLocaleDateString('ko-KR')}
                      </div>
                      <div style={{ 
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                      }}>
                        ⛓️ TX: {purchase.tx_hash.slice(0, 20)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 판매 목록 탭 */}
        {activeTab === 'sales' && (
          <>
            {soldDocs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 60,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                  판매 중인 문서가 없습니다
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 24,
              }}>
                {soldDocs.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                      borderRadius: 16,
                      padding: 24,
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = 'rgba(79,157,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
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
                          Doc ID: {doc.doc_id}
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
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>판매 가격</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                          {doc.price_per_token} ETH
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>남은 수량</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {doc.amount}개
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>등록일</span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn"
                      onClick={() => handleDelete(doc.doc_id, doc.id)}
                      disabled={deleting === doc.id}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        opacity: deleting === doc.id ? 0.6 : 1,
                      }}
                    >
                      {deleting === doc.id ? '⏳ 삭제 중...' : '🗑️ 문서 삭제'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}