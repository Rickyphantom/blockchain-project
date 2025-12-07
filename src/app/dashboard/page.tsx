'use client';

import { useEffect, useState } from 'react';
import { getSigner } from '@/lib/web3';
import { getMyPurchases, downloadPdfFile } from '@/lib/supabase';

interface Purchase {
  id: number;
  doc_id: number;
  quantity: number;
  total_price: string;
  tx_hash: string;
  purchased_at: string;
  documents: {
    title: string;
    file_url: string;
    description: string;
    seller: string;
  };
}

export default function Dashboard() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const signer = await getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const myPurchases = await getMyPurchases(address);
        setPurchases(myPurchases);
      } catch (error) {
        console.error('구매 내역 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      await downloadPdfFile(fileUrl);
      alert(`✅ "${title}" 다운로드 완료!`);
    } catch (error) {
      console.error('다운로드 실패:', error);
      alert('❌ 다운로드 실패');
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
          📊 내 대시보드
        </h1>

        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 40,
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            내 지갑 주소
          </div>
          <div style={{
            fontSize: '1.1rem',
            fontFamily: 'monospace',
            color: 'var(--accent)',
            wordBreak: 'break-all',
          }}>
            {account || '연결되지 않음'}
          </div>
        </div>

        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 600,
          marginBottom: 24,
          color: 'var(--text-primary)',
        }}>
          💰 구매한 문서 ({purchases.length})
        </h2>

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
              아직 구매한 문서가 없습니다
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: 16,
          }}>
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                  borderRadius: 16,
                  padding: 24,
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: 600,
                    marginBottom: 8,
                    color: 'var(--text-primary)',
                  }}>
                    📄 {purchase.documents.title}
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {purchase.documents.description}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginTop: 12,
                  }}>
                    <div>💳 {purchase.total_price} ETH</div>
                    <div>📦 수량: {purchase.quantity}</div>
                    <div>📅 {new Date(purchase.purchased_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownload(purchase.documents.file_url, purchase.documents.title)}
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                  }}
                >
                  📥 다운로드
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}