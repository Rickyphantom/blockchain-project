'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Document {
  id: number;
  doc_id: number;
  title: string;
  description: string;
  seller: string;
  file_url: string;
  price_per_token: string;
  amount: number;
  is_active: boolean;
  created_at: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'sold'>('active');

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'active') {
        query = query.eq('is_active', true).gt('amount', 0);
      } else if (filter === 'sold') {
        query = query.eq('amount', 0);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('문서 로드 실패:', error);
      alert('문서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileUrl: string) => {
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    const icons: { [key: string]: string } = {
      pdf: '📄', doc: '📝', docx: '📝', txt: '📃',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🎨',
      mp4: '🎬', avi: '🎬', mov: '🎬',
      mp3: '🎵', wav: '🎵',
      zip: '📦', rar: '📦',
    };
    return icons[ext || ''] || '📎';
  };

  const short = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCardClick = (docId: number) => {
    router.push(`/marketplace/${docId}`);
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
        <div style={{ fontSize: '1.2rem', color: '#ffffff' }}>
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
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 16,
          }}>
            🏪 마켓플레이스
          </h1>
          <p style={{
            fontSize: '1rem',
            color: '#ffffff',
            marginBottom: 24,
          }}>
            블록체인에 등록된 파일을 구매하세요
          </p>

          {/* 필터 버튼 */}
          <div style={{ display: 'flex', gap: 12 }}>
            {Object.entries({ all: '전체', active: '판매중', sold: '품절' }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key as 'all' | 'active' | 'sold')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: filter === key ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 문서 목록 */}
        {documents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 80,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: '1.2rem', color: '#ffffff' }}>
              등록된 파일이 없습니다
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleCardClick(doc.doc_id)}
                style={{
                  background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                  borderRadius: 16,
                  padding: 24,
                  border: '1px solid rgba(79,157,255,0.2)',
                  cursor: 'pointer',
                }}
              >
                {/* 상태 배지 */}
                <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  {doc.is_active && doc.amount > 0 ? (
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'rgba(34,197,94,0.2)',
                      color: '#22c55e',
                    }}>
                      ✅ 판매중
                    </span>
                  ) : (
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'rgba(239,68,68,0.2)',
                      color: '#ef4444',
                    }}>
                      ❌ 품절
                    </span>
                  )}
                  <span style={{ fontSize: '2rem' }}>
                    {getFileIcon(doc.file_url)}
                  </span>
                </div>

                {/* 제목 */}
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: 12,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {doc.title}
                </h3>

                {/* 설명 */}
                <p style={{
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  marginBottom: 16,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  opacity: 0.8,
                  minHeight: 45,
                }}>
                  {doc.description}
                </p>

                {/* 정보 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#ffffff',
                      marginBottom: 4,
                      opacity: 0.7,
                    }}>
                      💰 가격
                    </div>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}>
                      {doc.price_per_token} ETH
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#ffffff',
                      marginBottom: 4,
                      opacity: 0.7,
                    }}>
                      🔢 남은 수량
                    </div>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: doc.amount > 0 ? '#ffffff' : '#ef4444',
                    }}>
                      {doc.amount}개
                    </div>
                  </div>
                </div>

                {/* 판매자 */}
                <div style={{
                  marginTop: 12,
                  fontSize: '0.8rem',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  opacity: 0.7,
                }}>
                  👤 {short(doc.seller)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
