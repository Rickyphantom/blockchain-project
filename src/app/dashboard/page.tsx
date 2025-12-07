'use client';

import { useEffect, useState } from 'react';
import { getTransactionsByUser, getDocumentsBySeller } from '@/lib/supabase';
import { getSigner } from '@/lib/web3';

interface Transaction {
  id: number;
  doc_id: number;
  seller: string;
  buyer: string;
  amount: number;
  price_per_token: string;
  total_price: string;
  created_at: string;
}

interface Document {
  id: number;
  doc_id: number;
  title: string;
  price_per_token: string;
  created_at: string;
}

export default function DashboardPage() {
  const [userAddress, setUserAddress] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myDocuments, setMyDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const signer = await getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);

      const [txs, docs] = await Promise.all([
        getTransactionsByUser(address),
        getDocumentsBySeller(address),
      ]);

      setTransactions(txs || []);
      setMyDocuments(docs || []);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>로딩 중...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>📊 대시보드</h1>

      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <strong>지갑 주소:</strong> {userAddress.slice(0, 12)}...{userAddress.slice(-10)}
      </div>

      {/* 내 문서 */}
      <h2>📄 내가 등록한 문서</h2>
      {myDocuments.length === 0 ? (
        <p>등록한 문서가 없습니다</p>
      ) : (
        <div style={{ marginBottom: '40px' }}>
          {myDocuments.map((doc) => (
            <div
              key={doc.id}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{doc.title}</h3>
                  <small style={{ color: '#666' }}>
                    ID: {doc.doc_id} | 가격: {doc.price_per_token} ETH
                  </small>
                </div>
                <div style={{ textAlign: 'right', color: '#999', fontSize: '12px' }}>
                  {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 거래 내역 */}
      <h2>💰 거래 내역</h2>
      {transactions.length === 0 ? (
        <p>거래 내역이 없습니다</p>
      ) : (
        <div>
          {transactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px',
                backgroundColor: tx.buyer === userAddress ? '#e8f5e9' : '#fff3e0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div>
                    <strong>
                      {tx.buyer === userAddress ? '🛒 구매' : '📤 판매'}
                    </strong>
                  </div>
                  <small style={{ color: '#666' }}>
                    문서 ID: {tx.doc_id} | {tx.amount}개
                  </small>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    상대방: {(tx.buyer === userAddress ? tx.seller : tx.buyer).slice(0, 12)}...
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                    {tx.total_price} ETH
                  </div>
                  <small style={{ color: '#999' }}>
                    {new Date(tx.created_at).toLocaleDateString('ko-KR')}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}