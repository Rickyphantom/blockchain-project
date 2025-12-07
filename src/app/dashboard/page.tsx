'use client';

import { useEffect, useState } from 'react';
import { getSigner } from '@/lib/web3';
import { supabase } from '@/lib/supabase';
import { deactivateDocument, getDocument } from '@/lib/useDocuTrade';

interface MyDocument {
  id: number;
  doc_id: number;
  title: string;
  description: string;
  price_per_token: string;
  amount: number;
  created_at: string;
  isActive?: boolean;
}

export default function MySalesPage() {
  const [userAddress, setUserAddress] = useState<string>('');
  const [documents, setDocuments] = useState<MyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const signer = await getSigner();
        const address = await signer.getAddress();
        setUserAddress(address.toLowerCase());

        // Supabase에서 내가 등록한 문서 조회
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('seller', address.toLowerCase())
          .order('created_at', { ascending: false });

        if (error) throw error;

        // 블록체인에서 isActive 상태 가져오기
        const docsWithStatus = await Promise.all(
          (data || []).map(async (doc) => {
            try {
              const blockchainDoc = await getDocument(doc.doc_id);
              return {
                ...doc,
                isActive: blockchainDoc.isActive,
              };
            } catch (error) {
              console.error(`문서 ${doc.doc_id} 상태 조회 실패:`, error);
              return {
                ...doc,
                isActive: false,
              };
            }
          })
        );

        setDocuments(docsWithStatus);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleDeactivate = async (docId: number) => {
    if (!confirm('정말 판매를 중단하시겠습니까?')) return;

    try {
      setDeactivating(docId);
      
      // 블록체인에서 판매 중단
      const txHash = await deactivateDocument(docId);
      
      alert(`✅ 판매 중단 완료!\n\nTX: ${txHash.slice(0, 20)}...`);
      
      // 상태 업데이트
      setDocuments(docs =>
        docs.map(doc =>
          doc.doc_id === docId ? { ...doc, isActive: false } : doc
        )
      );
    } catch (error) {
      console.error('판매 중단 실패:', error);
      alert(`❌ 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDeactivating(null);
    }
  };

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

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
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 16,
          }}>
            🏪 내 판매 목록
          </h1>
          <div style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span>💼</span>
            <span>{short(userAddress)}</span>
            <span>•</span>
            <span>{documents.length}개 문서</span>
          </div>
        </div>

        {documents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              등록한 문서가 없습니다
            </div>
            <a
              href="/upload"
              className="btn btn-primary"
              style={{
                display: 'inline-block',
                textDecoration: 'none',
                padding: '12px 24px',
              }}
            >
              📤 문서 등록하기
            </a>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: 16,
          }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                  borderRadius: 12,
                  padding: 24,
                  border: `1px solid ${doc.isActive ? 'rgba(79,157,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.3s ease',
                  opacity: doc.isActive ? 1 : 0.6,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: 16,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}>
                      <h3 style={{
                        fontSize: '1.3rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}>
                        {doc.title}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: doc.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                        color: doc.isActive ? '#22c55e' : '#ef4444',
                      }}>
                        {doc.isActive ? '✅ 판매중' : '⏸️ 중단됨'}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 12,
                    }}>
                      {doc.description}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 16,
                  marginBottom: 16,
                }}>
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: 12,
                    borderRadius: 8,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 4,
                    }}>
                      💰 가격
                    </div>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'var(--accent)',
                    }}>
                      {doc.price_per_token} ETH
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: 12,
                    borderRadius: 8,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 4,
                    }}>
                      🔢 수량
                    </div>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}>
                      {doc.amount}개
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: 12,
                    borderRadius: 8,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 4,
                    }}>
                      📋 문서 ID
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                    }}>
                      #{doc.doc_id}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: 12,
                    borderRadius: 8,
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 4,
                    }}>
                      📅 등록일
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                    }}>
                      {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: 12,
                }}>
                  <button
                    onClick={() => window.open(`/marketplace/${doc.doc_id}`, '_blank')}
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '0.9rem',
                    }}
                  >
                    👁️ 상세보기
                  </button>
                  
                  {doc.isActive && (
                    <button
                      onClick={() => handleDeactivate(doc.doc_id)}
                      disabled={deactivating === doc.doc_id}
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: '0.9rem',
                        background: 'rgba(239,68,68,0.2)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 8,
                        color: '#ef4444',
                        fontWeight: 600,
                        cursor: deactivating === doc.doc_id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (deactivating !== doc.doc_id) {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                      }}
                    >
                      {deactivating === doc.doc_id ? '⏳ 처리 중...' : '⏸️ 판매 중단'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}