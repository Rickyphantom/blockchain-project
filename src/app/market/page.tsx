// app/market/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getDocuments, searchDocuments } from '@/lib/supabase';
import { getSigner } from '@/lib/web3';

interface Document {
  id: number;
  doc_id: number;
  title: string;
  seller: string;
  description: string;
  price_per_token: string;
  amount: number;
  created_at: string;
  pdf_url: string;
}

interface PendingPurchase {
  doc_id: number;
  seller: string;
  amount: number;
  price_per_token: string;
  title: string;
}

export default function MarketPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState('');
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const signer = await getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);

      const data = await getDocuments();
      setDocuments(data || []);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }
    try {
      setLoading(true);
      const data = await searchDocuments(searchQuery);
      setDocuments(data || []);
    } catch (error) {
      console.error('검색 실패:', error);
      alert('검색 실패');
    } finally {
      setLoading(false);
    }
  };

  // 대기 중인 구매에 추가
  const handleAddToCart = (doc: Document) => {
    const pending: PendingPurchase = {
      doc_id: doc.doc_id,
      seller: doc.seller,
      amount: 1,
      price_per_token: doc.price_per_token,
      title: doc.title,
    };

    const existing = localStorage.getItem(`pending_purchases_${userAddress}`);
    const pendingList: PendingPurchase[] = existing ? JSON.parse(existing) : [];

    // 중복 확인
    if (pendingList.some((p) => p.doc_id === doc.doc_id)) {
      alert('❌ 이미 대기 중인 구매입니다');
      return;
    }

    pendingList.push(pending);
    localStorage.setItem(`pending_purchases_${userAddress}`, JSON.stringify(pendingList));

    // 메시지 표시
    setCartMessage(`✅ "${doc.title}"이(가) 대기 중인 거래에 추가되었습니다!`);
    setTimeout(() => setCartMessage(''), 3000);
  };

  // 파일 다운로드
  const handleDownload = (fileUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${title}`;
    link.click();
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <div style={{ fontSize: '40px', marginBottom: '15px' }}>⏳</div>
          <h2 style={{ color: '#666' }}>로딩 중...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '10px', color: '#333' }}>📚 문서 마켓</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          다양한 문서를 블록체인으로 안전하게 거래하세요
        </p>

        {/* 검색 바 */}
        <div
          style={{
            marginBottom: '30px',
            display: 'flex',
            gap: '10px',
            backgroundColor: '#fff',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <input
            type="text"
            placeholder="제목이나 설명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            🔍 검색
          </button>
          <button
            onClick={loadData}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            🔄 초기화
          </button>
        </div>

        {/* 성공 메시지 */}
        {cartMessage && (
          <div
            style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '6px',
              color: '#155724',
              fontWeight: 'bold',
              animation: 'fadeInOut 3s ease-in-out',
            }}
          >
            {cartMessage}
          </div>
        )}

        {/* 문서 목록 */}
        {documents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>📭</div>
            <h3 style={{ color: '#333', marginBottom: '10px' }}>등록된 문서가 없습니다</h3>
            <p style={{ color: '#666' }}>첫 번째 문서를 업로드해보세요!</p>
            <a
              href="/upload"
              style={{
                display: 'inline-block',
                marginTop: '20px',
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
              }}
            >
              📤 문서 업로드하기
            </a>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
              📊 총 <strong>{documents.length}</strong>개의 문서가 있습니다
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.3s, transform 0.3s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* 문서 제목 */}
                  <h3
                    style={{
                      margin: '0 0 10px 0',
                      color: '#333',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      lineHeight: '1.4',
                    }}
                  >
                    {doc.title}
                  </h3>

                  {/* 설명 */}
                  <p
                    style={{
                      color: '#666',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      flex: 1,
                      marginBottom: '15px',
                      minHeight: '60px',
                    }}
                  >
                    {doc.description.length > 100
                      ? doc.description.slice(0, 100) + '...'
                      : doc.description}
                  </p>

                  {/* 판매자 및 날짜 */}
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#999',
                      marginBottom: '15px',
                      paddingBottom: '15px',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <div style={{ marginBottom: '5px' }}>
                      <strong>👤 판매자:</strong> {doc.seller.slice(0, 12)}...
                    </div>
                    <div>
                      <strong>📅 등록일:</strong>{' '}
                      {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  {/* 가격 카드 */}
                  <div
                    style={{
                      backgroundColor: '#f0f8ff',
                      padding: '12px',
                      borderRadius: '6px',
                      marginBottom: '15px',
                      borderLeft: '4px solid #007bff',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>
                      💰 가격
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                      {doc.price_per_token} ETH
                    </div>
                  </div>

                  {/* 버튼 그룹 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => handleAddToCart(doc)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'background-color 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#218838';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#28a745';
                      }}
                    >
                      🛒 대기 중인 거래 추가
                    </button>

                    <button
                      onClick={() => handleDownload(doc.pdf_url, doc.title)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        transition: 'background-color 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#138496';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#17a2b8';
                      }}
                    >
                      📥 미리보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
