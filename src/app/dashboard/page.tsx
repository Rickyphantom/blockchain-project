'use client';

import { useEffect, useState } from 'react';
import { getSigner } from '@/lib/web3';
import { supabase } from '@/lib/supabase';
import {
  getUserNFTs,
  getDocumentByToken,
  deactivateDocument,
} from '@/lib/useDocuTrade';
import NFTCertificate from '@/components/NFTCertificate';
import { getUserPurchases } from '@/lib/supabase';

interface PurchasedDocument {
  tokenId: number;
  docId: number;
  title: string;
  description: string;
  price: string;
  fileUrl: string;
  seller: string;
  purchaseDate?: string;
}

interface MyDocument {
  id: number;
  doc_id: number;
  title: string;
  description: string;
  price_per_token: string;
  amount: number;
  created_at: string;
  is_active: boolean;
  file_url: string;
}

interface NFTItem {
  tokenId: number;
  docId: number;
  title: string;
  description: string;
  seller: string;
  price: string;
}

export default function DashboardPage() {
  const [userAddress, setUserAddress] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'purchases' | 'nfts' | 'sales'>(
    'purchases'
  );
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<number | null>(null);

  // 구매 목록
  const [purchasedDocs, setPurchasedDocs] = useState<PurchasedDocument[]>([]);

  // NFT 목록
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<{
    tokenId: number;
    docId: number;
    title: string;
  } | null>(null);

  // 판매 목록
  const [salesDocs, setSalesDocs] = useState<MyDocument[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const signer = await getSigner();
        const address = await signer.getAddress();
        setUserAddress(address.toLowerCase());

        await Promise.all([
          loadPurchases(address),
          loadNFTs(address),
          loadSales(address),
        ]);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // 구매 목록 로드
  const loadPurchases = async (address: string) => {
    try {
      const data = await getUserPurchases(address);

      const purchases = (data || []).map((p: any) => ({
        tokenId: p.id,
        docId: p.doc_id,
        title: p.documents?.title || 'Unknown',
        description: p.documents?.description || '',
        price: p.total_price,
        fileUrl: p.documents?.file_url || '',
        seller: p.documents?.seller || '',
        purchaseDate: p.purchased_at,
        quantity: p.quantity,
        txHash: p.tx_hash,
      }));

      setPurchasedDocs(purchases);
    } catch (error) {
      console.error('구매 목록 로드 실패:', error);
    }
  };

  // NFT 목록 로드
  const loadNFTs = async (address: string) => {
    try {
      const tokenIds = await getUserNFTs(address);

      const nftData = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const doc = await getDocumentByToken(tokenId);
            return {
              tokenId,
              docId: doc.docId,
              title: doc.title,
              description: doc.description,
              seller: doc.seller,
              price: doc.pricePerToken,
            };
          } catch (error) {
            console.error(`NFT ${tokenId} 로드 실패:`, error);
            return null;
          }
        })
      );

      setNfts(nftData.filter((nft): nft is NFTItem => nft !== null));
    } catch (error) {
      console.error('NFT 목록 로드 실패:', error);
    }
  };

  // 판매 목록 로드
  const loadSales = async (address: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('seller', address.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('판매 목록 로드 에러:', error);
        throw error;
      }

      console.log('로드된 판매 문서:', data);
      setSalesDocs(data || []);
    } catch (error) {
      console.error('판매 목록 로드 실패:', error);
    }
  };

  // 판매 중단
  const handleDeactivate = async (docId: number) => {
    if (!confirm('판매를 중단하시겠습니까?')) {
      return;
    }

    try {
      setDeactivating(docId);

      // 블록체인 호출 없이 Supabase만 업데이트
      const { error } = await supabase
        .from('documents')
        .update({ is_active: false })
        .eq('doc_id', docId)
        .eq('seller', userAddress.toLowerCase());

      if (error) throw error;

      alert('✅ 판매가 중단되었습니다.');

      // 목록 새로고침
      await loadSales(userAddress);
    } catch (error) {
      console.error('판매 중단 실패:', error);
      alert(
        `❌ 판매 중단 실패: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setDeactivating(null);
    }
  };

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const downloadFile = (fileUrl: string, title: string) => {
    window.open(fileUrl, '_blank');
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
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          로딩 중...
        </div>
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
            📊 대시보드
          </h1>
          <div
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>💼</span>
            <span>{short(userAddress)}</span>
          </div>
        </div>

        {/* 통계 카드 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(79,157,255,0.2), rgba(79,157,255,0.05))',
              padding: 24,
              borderRadius: 12,
              border: '1px solid rgba(79,157,255,0.3)',
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: 8,
              }}
            >
              🛒 구매한 문서
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--accent)',
              }}
            >
              {purchasedDocs.length}
            </div>
          </div>

          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))',
              padding: 24,
              borderRadius: 12,
              border: '1px solid rgba(168,85,247,0.3)',
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: 8,
              }}
            >
              🎫 보유 NFT
            </div>
            <div
              style={{ fontSize: '2rem', fontWeight: 700, color: '#a855f7' }}
            >
              {nfts.length}
            </div>
          </div>

          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))',
              padding: 24,
              borderRadius: 12,
              border: '1px solid rgba(34,197,94,0.3)',
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: 8,
              }}
            >
              🏪 판매 중인 문서
            </div>
            <div
              style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e' }}
            >
              {salesDocs.filter((d) => d.is_active).length}
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {[
            {
              key: 'purchases',
              label: '🛒 구매 목록',
              count: purchasedDocs.length,
            },
            { key: 'nfts', label: '🎫 NFT 컬렉션', count: nfts.length },
            { key: 'sales', label: '🏪 내 판매', count: salesDocs.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 24px',
                background:
                  activeTab === tab.key
                    ? 'rgba(79,157,255,0.2)'
                    : 'transparent',
                border: 'none',
                borderBottom:
                  activeTab === tab.key
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                color:
                  activeTab === tab.key
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.95rem',
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* 구매 목록 */}
        {activeTab === 'purchases' && (
          <div>
            {purchasedDocs.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 60,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛒</div>
                <div
                  style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}
                >
                  구매한 문서가 없습니다
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {purchasedDocs.map((doc) => (
                  <div
                    key={doc.tokenId}
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                      borderRadius: 12,
                      padding: 24,
                      border: '1px solid rgba(79,157,255,0.3)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: '1.3rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: 8,
                          }}
                        >
                          {doc.title}
                        </h3>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 16,
                          }}
                        >
                          {doc.description}
                        </p>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: 12,
                            marginBottom: 16,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              💰 구매 가격
                            </div>
                            <div
                              style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: 'var(--accent)',
                              }}
                            >
                              {doc.price} ETH
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              🎫 Token ID
                            </div>
                            <div
                              style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                fontFamily: 'monospace',
                              }}
                            >
                              #{doc.tokenId}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              📅 구매일
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                              {doc.purchaseDate
                                ? new Date(doc.purchaseDate).toLocaleDateString(
                                    'ko-KR'
                                  )
                                : '-'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                          <button
                            onClick={() => downloadFile(doc.fileUrl, doc.title)}
                            className="btn btn-primary"
                            style={{
                              flex: 1,
                              padding: '10px 20px',
                              fontSize: '0.9rem',
                            }}
                          >
                            📥 다운로드
                          </button>
                          <button
                            onClick={() =>
                              setSelectedNFT({
                                tokenId: doc.tokenId,
                                docId: doc.docId,
                                title: doc.title,
                              })
                            }
                            className="btn btn-secondary"
                            style={{
                              flex: 1,
                              padding: '10px 20px',
                              fontSize: '0.9rem',
                            }}
                          >
                            🏆 증명서 보기
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NFT 컬렉션 */}
        {activeTab === 'nfts' && (
          <div>
            {nfts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 60,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎫</div>
                <div
                  style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}
                >
                  보유한 NFT가 없습니다
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 20,
                }}
              >
                {nfts.map((nft) => (
                  <div
                    key={nft.tokenId}
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))',
                      borderRadius: 12,
                      padding: 20,
                      border: '1px solid rgba(168,85,247,0.3)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow =
                        '0 8px 24px rgba(168,85,247,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 150,
                        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                        borderRadius: 8,
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '4rem',
                      }}
                    >
                      🎫
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#a855f7',
                        fontWeight: 600,
                        marginBottom: 4,
                        fontFamily: 'monospace',
                      }}
                    >
                      TOKEN #{nft.tokenId}
                    </div>

                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 8,
                      }}
                    >
                      {nft.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginBottom: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {nft.description}
                    </p>

                    <button
                      onClick={() =>
                        setSelectedNFT({
                          tokenId: nft.tokenId,
                          docId: nft.docId,
                          title: nft.title,
                        })
                      }
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '0.9rem',
                      }}
                    >
                      🏆 증명서 보기
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 판매 목록 */}
        {activeTab === 'sales' && (
          <div>
            {salesDocs.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 60,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏪</div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 16,
                  }}
                >
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
              <div style={{ display: 'grid', gap: 16 }}>
                {salesDocs.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                      borderRadius: 12,
                      padding: 24,
                      border: `1px solid ${
                        doc.is_active
                          ? 'rgba(34,197,94,0.3)'
                          : 'rgba(255,255,255,0.08)'
                      }`,
                      opacity: doc.is_active ? 1 : 0.6,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <h3
                            style={{
                              fontSize: '1.3rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {doc.title}
                          </h3>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: 20,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: doc.is_active
                                ? 'rgba(34,197,94,0.2)'
                                : 'rgba(239,68,68,0.2)',
                              color: doc.is_active ? '#22c55e' : '#ef4444',
                            }}
                          >
                            {doc.is_active ? '✅ 판매중' : '⏸️ 중단됨'}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 16,
                          }}
                        >
                          {doc.description}
                        </p>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: 12,
                            marginBottom: 16,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              💰 가격
                            </div>
                            <div
                              style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                color: 'var(--accent)',
                              }}
                            >
                              {doc.price_per_token} ETH
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              🔢 남은 수량
                            </div>
                            <div
                              style={{ fontSize: '1.1rem', fontWeight: 600 }}
                            >
                              {doc.amount}개
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              📅 등록일
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                              {new Date(doc.created_at).toLocaleDateString(
                                'ko-KR'
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                          {doc.is_active && (
                            <button
                              onClick={() => handleDeactivate(doc.doc_id)}
                              disabled={deactivating === doc.doc_id}
                              className="btn btn-secondary"
                              style={{
                                padding: '10px 20px',
                                fontSize: '0.9rem',
                                background: 'rgba(239,68,68,0.2)',
                                color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.3)',
                                cursor:
                                  deactivating === doc.doc_id
                                    ? 'not-allowed'
                                    : 'pointer',
                                opacity: deactivating === doc.doc_id ? 0.6 : 1,
                              }}
                            >
                              {deactivating === doc.doc_id
                                ? '⏳ 처리중...'
                                : '⏸️ 판매중단'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* NFT 증명서 모달 */}
      {selectedNFT && (
        <NFTCertificate
          tokenId={selectedNFT.tokenId}
          docId={selectedNFT.docId}
          title={selectedNFT.title}
          onClose={() => setSelectedNFT(null)}
        />
      )}
    </div>
  );
}
