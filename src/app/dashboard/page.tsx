'use client';

import { useEffect, useState } from 'react';
import { getSigner } from '@/lib/web3';
import { supabase } from '@/lib/supabase';
import { getUserNFTs, getDocumentByToken } from '@/lib/useDocuTrade';
import NFTCertificate from '@/components/NFTCertificate';

interface Purchase {
  id: number;
  doc_id: number;
  quantity: number;
  total_price: string;
  tx_hash: string;
  created_at: string;
  documents: {
    title: string;
    description: string;
  };
}

interface NFTItem {
  tokenId: number;
  docId: number;
  title: string;
  description: string;
}

interface Sale {
  id: number;
  doc_id: number;
  quantity: number;
  total_price: string;
  tx_hash: string;
  created_at: string;
  buyer: string;
  documents: {
    title: string;
    description: string;
  };
}

export default function Dashboard() {
  const [userAddress, setUserAddress] = useState<string>('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales' | 'nfts'>(
    'purchases'
  );
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const signer = await getSigner();
        const address = await signer.getAddress();
        setUserAddress(address.toLowerCase());

        // 구매 내역 조회
        const { data: purchaseData, error } = await supabase
          .from('purchases')
          .select(
            `
            *,
            documents (
              title,
              description
            )
          `
          )
          .eq('buyer', address.toLowerCase())
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPurchases(purchaseData || []);

        // 판매 내역 조회 (내가 올린 문서를 다른 사람이 구매한 내역)
        const { data: docsData } = await supabase
          .from('documents')
          .select('id')
          .eq('seller', address.toLowerCase());

        const docIds = docsData?.map((d) => d.id) || [];

        if (docIds.length > 0) {
          const { data: salesData, error: salesError } = await supabase
            .from('purchases')
            .select(
              `
              *,
              documents (
                title,
                description
              )
            `
            )
            .in('doc_id', docIds)
            .order('created_at', { ascending: false });

          if (salesError) {
            console.error('판매 내역 조회 실패:', salesError);
          } else {
            setSales(salesData || []);
          }
        }

        // NFT 조회
        const nftIds = await getUserNFTs(address);
        const nftDetails: NFTItem[] = [];

        for (const tokenId of nftIds) {
          try {
            const doc = await getDocumentByToken(tokenId);
            nftDetails.push({
              tokenId,
              docId: doc.docId,
              title: doc.title,
              description: doc.description,
            });
          } catch (error) {
            console.error(`NFT ${tokenId} 조회 실패:`, error);
          }
        }

        setNfts(nftDetails);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

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
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
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

        {/* 탭 버튼 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 32,
            borderBottom: '2px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            onClick={() => setActiveTab('purchases')}
            style={{
              padding: '12px 24px',
              background:
                activeTab === 'purchases'
                  ? 'rgba(79,157,255,0.2)'
                  : 'transparent',
              border: 'none',
              borderBottom:
                activeTab === 'purchases'
                  ? '3px solid var(--accent)'
                  : '3px solid transparent',
              color:
                activeTab === 'purchases'
                  ? 'var(--accent)'
                  : 'var(--text-secondary)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            🛒 구매 내역 ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            style={{
              padding: '12px 24px',
              background:
                activeTab === 'sales' ? 'rgba(79,157,255,0.2)' : 'transparent',
              border: 'none',
              borderBottom:
                activeTab === 'sales'
                  ? '3px solid var(--accent)'
                  : '3px solid transparent',
              color:
                activeTab === 'sales'
                  ? 'var(--accent)'
                  : 'var(--text-secondary)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            💰 판매 내역 ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab('nfts')}
            style={{
              padding: '12px 24px',
              background:
                activeTab === 'nfts' ? 'rgba(79,157,255,0.2)' : 'transparent',
              border: 'none',
              borderBottom:
                activeTab === 'nfts'
                  ? '3px solid var(--accent)'
                  : '3px solid transparent',
              color:
                activeTab === 'nfts'
                  ? 'var(--accent)'
                  : 'var(--text-secondary)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            🎫 내 NFT ({nfts.length})
          </button>
        </div>

        {/* 구매 내역 탭 */}
        {activeTab === 'purchases' && (
          <div>
            {purchases.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 60,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
                <div
                  style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}
                >
                  구매 내역이 없습니다
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: 16,
                }}
              >
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                      borderRadius: 12,
                      padding: 20,
                      border: '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        'rgba(79,157,255,0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: 4,
                          }}
                        >
                          {purchase.documents?.title || '제목 없음'}
                        </h3>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 8,
                          }}
                        >
                          {purchase.documents?.description || '설명 없음'}
                        </p>
                      </div>
                      <div
                        style={{
                          background: 'rgba(79,157,255,0.2)',
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--accent)',
                        }}
                      >
                        {purchase.quantity}개
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          구매 가격
                        </div>
                        <div
                          style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--accent)',
                          }}
                        >
                          {purchase.total_price} ETH
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          구매 일시
                        </div>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {new Date(purchase.created_at).toLocaleString(
                            'ko-KR'
                          )}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          트랜잭션
                        </div>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${purchase.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--accent)',
                            textDecoration: 'none',
                            fontFamily: 'monospace',
                          }}
                        >
                          {short(purchase.tx_hash)} 🔗
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 판매 내역 탭 */}
        {activeTab === 'sales' && (
          <div>
            {sales.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 60,
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>💰</div>
                <div
                  style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}
                >
                  판매 내역이 없습니다
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: 16,
                }}
              >
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                      borderRadius: 12,
                      padding: 20,
                      border: '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: 4,
                          }}
                        >
                          {sale.documents?.title || '제목 없음'}
                        </h3>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 8,
                          }}
                        >
                          {sale.documents?.description || '설명 없음'}
                        </p>
                      </div>
                      <div
                        style={{
                          background: 'rgba(34,197,94,0.2)',
                          padding: '4px 12px',
                          borderRadius: 20,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#22c55e',
                        }}
                      >
                        {sale.quantity}개 판매
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          판매 금액
                        </div>
                        <div
                          style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#22c55e',
                          }}
                        >
                          {sale.total_price} ETH
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          구매자
                        </div>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {short(sale.buyer)}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          판매 일시
                        </div>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {new Date(sale.created_at).toLocaleString('ko-KR')}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                          }}
                        >
                          트랜잭션
                        </div>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${sale.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--accent)',
                            textDecoration: 'none',
                            fontFamily: 'monospace',
                          }}
                        >
                          {short(sale.tx_hash)} 🔗
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NFT 탭 */}
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
                  소유한 NFT가 없습니다
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 20,
                }}
              >
                {nfts.map((nft) => (
                  <div
                    key={nft.tokenId}
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(79,157,255,0.1), rgba(99,102,241,0.1))',
                      borderRadius: 16,
                      padding: 20,
                      border: '2px solid rgba(79,157,255,0.3)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedNFT(nft)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor =
                        'rgba(79,157,255,0.5)';
                      e.currentTarget.style.boxShadow =
                        '0 12px 48px rgba(79,157,255,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor =
                        'rgba(79,157,255,0.3)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 180,
                        background:
                          'linear-gradient(135deg, var(--accent), var(--primary))',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '4rem',
                        marginBottom: 16,
                      }}
                    >
                      🎫
                    </div>

                    <div
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        display: 'inline-block',
                        marginBottom: 12,
                      }}
                    >
                      Token #{nft.tokenId}
                    </div>

                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        marginBottom: 8,
                      }}
                    >
                      {nft.title}
                    </h3>

                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginBottom: 16,
                        lineHeight: 1.5,
                        minHeight: 40,
                      }}
                    >
                      {nft.description}
                    </p>

                    <button
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '0.9rem',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNFT(nft);
                      }}
                    >
                      🏆 소유권 증명서 보기
                    </button>
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
