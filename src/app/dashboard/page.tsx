'use client';

import { useEffect, useState } from 'react';
import {
  getTransactionsByUser,
  getDocumentsBySeller,
  getDocuments,
  recordTransaction,
  supabase,
} from '@/lib/supabase';
import { getSigner } from '@/lib/web3';
import { buyDocument } from '@/lib/useDocuTrade';

interface Transaction {
  id: number;
  doc_id: number;
  seller: string;
  buyer: string;
  amount: number;
  price_per_token: string;
  total_price: string;
  tx_hash: string;
  status: string;
  created_at: string;
}

interface Document {
  id: number;
  doc_id: number;
  title: string;
  description: string;
  price_per_token: string;
  pdf_url: string;
  amount: number;
  seller: string;
  created_at: string;
}

interface PendingPurchase {
  doc_id: number;
  seller: string;
  amount: number;
  price_per_token: string;
  title: string;
}

type TabType = 'sales' | 'purchases' | 'pending';

export default function DashboardPage() {
  const [userAddress, setUserAddress] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [myDocuments, setMyDocuments] = useState<Document[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const signer = await getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);

      // 판매 문서
      const docs = await getDocumentsBySeller(address);
      setMyDocuments(docs || []);

      // 완료된 거래
      const txs = await getTransactionsByUser(address);
      setTransactions(txs || []);

      // LocalStorage에서 대기 중인 구매 불러오기
      const pending = localStorage.getItem(`pending_purchases_${address}`);
      if (pending) {
        setPendingPurchases(JSON.parse(pending));
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  // PDF 다운로드
  const handleDownload = (pdfUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    link.click();
  };

  // 판매 문서 삭제
  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('doc_id', docId);

      if (error) throw error;
      alert('✅ 문서가 삭제되었습니다');
      loadData();
    } catch (error) {
      alert(`❌ 삭제 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 대기 중인 구매 완료
  const handleCompletePurchase = async (pending: PendingPurchase) => {
    try {
      setProcessingId(pending.doc_id);
      const signer = await getSigner();
      const buyer = await signer.getAddress();

      // 블록체인 거래
      await buyDocument(
        pending.doc_id,
        pending.seller,
        pending.amount,
        pending.price_per_token
      );

      // DB에 기록
      const totalPrice = (parseFloat(pending.price_per_token) * pending.amount).toString();
      await recordTransaction(
        pending.doc_id,
        pending.seller,
        buyer,
        pending.amount,
        pending.price_per_token,
        totalPrice,
        ''
      );

      // 대기 목록에서 제거
      const updated = pendingPurchases.filter((p) => p.doc_id !== pending.doc_id);
      setPendingPurchases(updated);
      localStorage.setItem(`pending_purchases_${userAddress}`, JSON.stringify(updated));

      alert('✅ 구매가 완료되었습니다!');
      loadData();
    } catch (error) {
      alert(`❌ 구매 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setProcessingId(null);
    }
  };

  // 대기 중인 구매 수정
  const handleEditPending = (pending: PendingPurchase) => {
    const newAmount = prompt(`구매 수량을 입력하세요 (현재: ${pending.amount}):`);
    if (newAmount === null || newAmount === '') return;

    const updated = pendingPurchases.map((p) =>
      p.doc_id === pending.doc_id ? { ...p, amount: Number(newAmount) } : p
    );
    setPendingPurchases(updated);
    localStorage.setItem(`pending_purchases_${userAddress}`, JSON.stringify(updated));
    alert('✅ 수량이 수정되었습니다');
  };

  // 대기 중인 구매 취소
  const handleCancelPending = (doc_id: number) => {
    if (!confirm('이 구매를 취소하시겠습니까?')) return;

    const updated = pendingPurchases.filter((p) => p.doc_id !== doc_id);
    setPendingPurchases(updated);
    localStorage.setItem(`pending_purchases_${userAddress}`, JSON.stringify(updated));
    alert('✅ 구매가 취소되었습니다');
  };

  // 장바구니에 추가
  const handleAddToCart = (doc: Document) => {
    const pending: PendingPurchase = {
      doc_id: doc.doc_id,
      seller: doc.seller,
      amount: 1,
      price_per_token: doc.price_per_token,
      title: doc.title,
    };

    const existing = pendingPurchases || [];
    const updated = [...existing, pending];
    localStorage.setItem(`pending_purchases_${userAddress}`, JSON.stringify(updated));
    
    alert('✅ 대기 중인 거래로 추가되었습니다! 대시보드에서 구매하세요.');
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>로딩 중...</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1>📊 내 대시보드</h1>

        {/* 지갑 정보 */}
        <div
          style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '2px solid #007bff',
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>🦊 연결된 지갑</h3>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#007bff',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}
          >
            {userAddress}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Ethereum Sepolia Testnet
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
          <button
            onClick={() => setActiveTab('sales')}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === 'sales' ? '#007bff' : '#f0f0f0',
              color: activeTab === 'sales' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px 5px 0 0',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            📤 판매 ({myDocuments.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === 'purchases' ? '#28a745' : '#f0f0f0',
              color: activeTab === 'purchases' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px 5px 0 0',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            🛒 구매 ({transactions.filter((t) => t.buyer === userAddress).length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '12px 20px',
              backgroundColor: activeTab === 'pending' ? '#ffc107' : '#f0f0f0',
              color: activeTab === 'pending' ? '#333' : '#333',
              border: 'none',
              borderRadius: '5px 5px 0 0',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            ⏳ 대기 중 ({pendingPurchases.length})
          </button>
        </div>

        {/* 판매 탭 */}
        {activeTab === 'sales' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>📤 내가 판매 중인 문서</h2>
            {myDocuments.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  color: '#666',
                }}
              >
                <p style={{ fontSize: '16px' }}>판매 중인 문서가 없습니다</p>
                <a
                  href="/upload"
                  style={{
                    color: '#007bff',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  문서 등록하기 →
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {myDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '20px',
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{doc.title}</h3>
                        <p
                          style={{
                            margin: '0 0 10px 0',
                            color: '#666',
                            fontSize: '14px',
                            lineHeight: '1.5',
                          }}
                        >
                          {doc.description.length > 150
                            ? doc.description.slice(0, 150) + '...'
                            : doc.description}
                        </p>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '10px',
                            fontSize: '13px',
                            color: '#666',
                          }}
                        >
                          <div>
                            <strong>가격:</strong> {doc.price_per_token} ETH
                          </div>
                          <div>
                            <strong>발행량:</strong> {doc.amount}
                          </div>
                          <div>
                            <strong>등록일:</strong>{' '}
                            {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                          </div>
                          <div>
                            <strong>Document ID:</strong> {doc.doc_id}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          marginLeft: '20px',
                        }}
                      >
                        <button
                          onClick={() => handleDownload(doc.pdf_url, doc.title)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          📥 다운로드
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.doc_id)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 구매 탭 */}
        {activeTab === 'purchases' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>🛒 내 구매 기록</h2>
            {transactions.filter((t) => t.buyer === userAddress).length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  color: '#666',
                }}
              >
                <p style={{ fontSize: '16px' }}>구매 기록이 없습니다</p>
                <a
                  href="/market"
                  style={{
                    color: '#007bff',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  마켓 보기 →
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {transactions
                  .filter((t) => t.buyer === userAddress)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        padding: '20px',
                        backgroundColor: '#e8f5e9',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '2px solid #4caf50',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>
                            ✅ 구매 완료
                          </h3>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '15px',
                              fontSize: '14px',
                              color: '#333',
                            }}
                          >
                            <div>
                              <strong>문서 ID:</strong> {tx.doc_id}
                            </div>
                            <div>
                              <strong>수량:</strong> {tx.amount}
                            </div>
                            <div>
                              <strong>개당 가격:</strong> {tx.price_per_token} ETH
                            </div>
                            <div>
                              <strong>총 금액:</strong>{' '}
                              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#4caf50' }}>
                                {tx.total_price} ETH
                              </span>
                            </div>
                            <div>
                              <strong>판매자:</strong> {tx.seller.slice(0, 12)}...
                            </div>
                            <div>
                              <strong>날짜:</strong>{' '}
                              {new Date(tx.created_at).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                          <div
                            style={{
                              fontSize: '28px',
                              fontWeight: 'bold',
                              color: '#4caf50',
                            }}
                          >
                            ✓
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 대기 중 탭 */}
        {activeTab === 'pending' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>⏳ 거래 대기 중</h2>
            {pendingPurchases.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  color: '#666',
                }}
              >
                <p style={{ fontSize: '16px' }}>대기 중인 거래가 없습니다</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pendingPurchases.map((pending) => (
                  <div
                    key={pending.doc_id}
                    style={{
                      padding: '20px',
                      backgroundColor: '#fff8e1',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '2px solid #ffc107',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#f57f17' }}>
                          ⏳ {pending.title}
                        </h3>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px',
                            fontSize: '14px',
                            color: '#333',
                          }}
                        >
                          <div>
                            <strong>문서 ID:</strong> {pending.doc_id}
                          </div>
                          <div>
                            <strong>판매자:</strong> {pending.seller.slice(0, 12)}...
                          </div>
                          <div>
                            <strong>개당 가격:</strong> {pending.price_per_token} ETH
                          </div>
                          <div>
                            <strong>구매 수량:</strong> {pending.amount}
                          </div>
                          <div>
                            <strong>총 금액:</strong>{' '}
                            <span
                              style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#f57f17',
                              }}
                            >
                              {(parseFloat(pending.price_per_token) * pending.amount).toFixed(4)} ETH
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          marginLeft: '20px',
                        }}
                      >
                        <button
                          onClick={() => handleCompletePurchase(pending)}
                          disabled={processingId === pending.doc_id}
                          style={{
                            padding: '10px 20px',
                            backgroundColor:
                              processingId === pending.doc_id ? '#ccc' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor:
                              processingId === pending.doc_id ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {processingId === pending.doc_id
                            ? '⏳ 처리 중...'
                            : '✅ 구매하기'}
                        </button>
                        <button
                          onClick={() => handleEditPending(pending)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ✏️ 수정
                        </button>
                        <button
                          onClick={() => handleCancelPending(pending.doc_id)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ❌ 취소
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}