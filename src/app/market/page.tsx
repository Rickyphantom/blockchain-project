'use client';

import React, { useEffect, useState } from 'react';
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
  title: string;
  price: string;
  amount: number;
  seller: string;
}

export default function MarketPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [userAddress, setUserAddress] = useState('');
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const signer = await getSigner();
        const addr = await signer.getAddress();
        setUserAddress(addr);
        const data = await getDocuments();
        setDocuments(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setLoading(true);
      try {
        const data = await getDocuments();
        setDocuments(data || []);
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const data = await searchDocuments(searchQuery);
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (doc: Document) => {
    const key = `pending_purchases_${userAddress || 'anon'}`;
    const existing = typeof window !== 'undefined' ? localStorage.getItem(key) : null;

    // 안전한 파싱: 로컬스토리지에서 불러온 값은 PendingPurchase[]로 간주
    const list: PendingPurchase[] = existing ? (JSON.parse(existing) as PendingPurchase[]) : [];

    if (list.some((p) => p.doc_id === doc.doc_id)) {
      setCartMessage('이미 장바구니에 있습니다');
      setTimeout(() => setCartMessage(''), 2000);
      return;
    }

    const item: PendingPurchase = {
      doc_id: doc.doc_id,
      title: doc.title,
      price: doc.price_per_token,
      amount: 1,
      seller: doc.seller,
    };

    list.push(item);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {
        console.error('localStorage setItem error', e);
      }
    }

    setCartMessage(`"${doc.title}" 장바구니에 추가됨`);
    setTimeout(() => setCartMessage(''), 2000);
  };

  const handleDownload = (fileUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = title;
    link.click();
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 36 }}>⏳</div>
        <div>로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>📚 문서 마켓</h1>
      <p style={{ color: '#9aa9c7', marginBottom: 22 }}>다양한 문서를 블록체인으로 안전하게 거래하세요</p>

      <div style={{ marginBottom: 18, display: 'flex', gap: 8 }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="제목이나 설명으로 검색..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'inherit' }}
        />
        <button onClick={handleSearch} style={{ padding: '10px 14px' }}>🔍 검색</button>
        <button onClick={() => { setSearchQuery(''); handleSearch(); }} style={{ padding: '10px 14px' }}>🔄 초기화</button>
      </div>

      {cartMessage && <div style={{ marginBottom: 12, padding: 10, background: '#173', borderRadius: 8 }}>{cartMessage}</div>}

      {documents.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
          <div style={{ fontSize: 40 }}>📭</div>
          <div style={{ marginTop: 8 }}>등록된 문서가 없습니다</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {documents.map((doc) => (
            <div key={doc.id} style={{ padding: 18, borderRadius: 10, background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ margin: '0 0 8px 0' }}>{doc.title}</h3>
              <p style={{ color: '#9aa9c7', minHeight: 60 }}>{doc.description.length > 120 ? doc.description.slice(0, 120) + '...' : doc.description}</p>
              <div style={{ color: '#9aa9c7', fontSize: 12, marginBottom: 12 }}>
                <div>👤 {doc.seller.slice(0, 12)}...</div>
                <div>📅 {new Date(doc.created_at).toLocaleDateString('ko-KR')}</div>
              </div>
              <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: 'rgba(79,157,255,0.04)' }}>
                <div style={{ fontSize: 12, color: '#9aa9c7' }}>💰 가격</div>
                <div style={{ fontWeight: 700 }}>{doc.price_per_token} ETH</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleAddToCart(doc)} style={{ flex: 1, padding: 10 }}>🛒 장바구니</button>
                <button onClick={() => handleDownload(doc.pdf_url, doc.title)} style={{ flex: 1, padding: 10 }}>📥 미리보기</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
