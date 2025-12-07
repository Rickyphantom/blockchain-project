// app/market/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getDocuments, searchDocuments, recordTransaction } from '@/lib/supabase';
import { buyDocument } from '@/lib/useDocuTrade';
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
}

export default function MarketPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data || []);
    } catch (error) {
      console.error('문서 로드 실패:', error);
      alert('문서 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDocuments();
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

  const handleBuy = async (doc: Document) => {
    try {
      setBuyingId(doc.doc_id);
      const signer = await getSigner();
      const buyer = await signer.getAddress();

      // ✅ 블록체인 구매
      await buyDocument(
        doc.doc_id,
        doc.seller,
        1,
        doc.price_per_token
      );

      // ✅ DB에 거래 기록 저장
      const totalPrice = (parseFloat(doc.price_per_token) * 1).toString();
      await recordTransaction(
        doc.doc_id,
        doc.seller,
        buyer,
        1,
        doc.price_per_token,
        totalPrice,
        '' // TX 해시는 나중에 추가 가능
      );

      alert('✅ 구매 완료!');
      loadDocuments();
    } catch (error) {
      console.error('구매 실패:', error);
      alert(`❌ 구매 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>로딩 중...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📚 문서 마켓</h1>

      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
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
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          🔍 검색
        </button>
      </div>

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>📭 등록된 문서가 없습니다</h3>
          <p>첫 번째 문서를 업로드해보세요!</p>
        </div>
      ) : (
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
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                {doc.title}
              </h3>

              <p
                style={{
                  color: '#666',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  flex: 1,
                  marginBottom: '15px',
                }}
              >
                {doc.description.length > 100
                  ? doc.description.slice(0, 100) + '...'
                  : doc.description}
              </p>

              <div style={{ fontSize: '13px', color: '#999', marginBottom: '15px' }}>
                <div>
                  <strong>판매자:</strong> {doc.seller.slice(0, 12)}...
                </div>
                <div>
                  <strong>등록일:</strong>{' '}
                  {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#f9f9f9',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#666' }}>가격</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                  {doc.price_per_token} ETH
                </div>
              </div>

              <button
                onClick={() => handleBuy(doc)}
                disabled={buyingId === doc.doc_id}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor:
                    buyingId === doc.doc_id ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor:
                    buyingId === doc.doc_id ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
              >
                {buyingId === doc.doc_id ? '🔄 구매 중...' : '🛒 구매하기'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
