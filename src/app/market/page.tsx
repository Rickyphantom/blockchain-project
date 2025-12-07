'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getSigner } from '@/lib/web3';
import { supabase, savePurchase } from '@/lib/supabase';
import { buyDocuments, ownsDocument } from '@/lib/useDocuTrade';

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

export default function DocumentDetailPage() {
  const params = useParams();
  const docId = parseInt(params.id as string);

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [alreadyOwns, setAlreadyOwns] = useState(false);
  const [isMyDocument, setIsMyDocument] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [docId]);

  const loadDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('doc_id', docId)
        .single();

      if (error) throw error;
      setDocument(data);

      // 지갑 연결 확인
      try {
        const signer = await getSigner();
        const address = await signer.getAddress();
        setUserAddress(address.toLowerCase());

        // 내 문서인지 확인
        if (data && address.toLowerCase() === data.seller.toLowerCase()) {
          setIsMyDocument(true);
        }

        // 소유 여부 확인
        const owns = await ownsDocument(address, docId);
        setAlreadyOwns(owns);
      } catch (error) {
        console.log('지갑 미연결');
      }
    } catch (error) {
      console.error('문서 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!document) return;
    if (!userAddress) {
      alert('먼저 지갑을 연결해주세요.');
      return;
    }

    if (quantity <= 0 || quantity > document.amount) {
      alert(`수량은 1~${document.amount} 사이여야 합니다.`);
      return;
    }

    if (!confirm(`${document.title}을(를) ${quantity}개 구매하시겠습니까?\n\n총 가격: ${(parseFloat(document.price_per_token) * quantity).toFixed(4)} ETH`)) {
      return;
    }

    try {
      setPurchasing(true);

      // 블록체인에서 구매
      const txHash = await buyDocuments(docId, quantity, document.price_per_token);

      // purchases 테이블에 저장
      await savePurchase(
        userAddress,
        docId,
        quantity,
        (parseFloat(document.price_per_token) * quantity).toString(),
        txHash
      );

      // 문서 수량 업데이트
      const newAmount = document.amount - quantity;
      await supabase
        .from('documents')
        .update({
          amount: newAmount,
          is_active: newAmount > 0,
        })
        .eq('doc_id', docId);

      alert(`✅ 구매 완료!\n\n파일을 다운로드할 수 있습니다.\n\nTX: ${txHash.slice(0, 20)}...`);

      // 페이지 새로고침
      loadDocument();
      setQuantity(1);
    } catch (error) {
      console.error('구매 실패:', error);
      alert(`❌ 구매 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setPurchasing(false);
    }
  };

  const handleDownload = () => {
    if (!document) return;
    
    if (isMyDocument || alreadyOwns) {
      window.open(document.file_url, '_blank');
    } else {
      alert('⚠️ 파일을 다운로드하려면 먼저 구매해주세요.');
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
        <div style={{ fontSize: '1.2rem', color: '#ffffff' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f1724 0%, #071022 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>❌</div>
          <div style={{ fontSize: '1.2rem', color: '#ffffff' }}>
            파일을 찾을 수 없습니다
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = (parseFloat(document.price_per_token) * quantity).toFixed(4);

  return (
    <div style={{
      minHeight: '100vh',
      padding: '80px 20px 40px',
      background: 'linear-gradient(135deg, #0f1724 0%, #071022 100%)',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
          borderRadius: 16,
          padding: 40,
          border: '1px solid rgba(79,157,255,0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {/* 상태 배지 */}
          <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {document.is_active ? (
              <span style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: '0.85rem',
                fontWeight: 600,
                background: 'rgba(34,197,94,0.2)',
                color: '#22c55e',
              }}>
                ✅ 판매중
              </span>
            ) : (
              <span style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: '0.85rem',
                fontWeight: 600,
                background: 'rgba(239,68,68,0.2)',
                color: '#ef4444',
              }}>
                ❌ 판매종료
              </span>
            )}
            {isMyDocument && (
              <span style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: '0.85rem',
                fontWeight: 600,
                background: 'rgba(59,130,246,0.2)',
                color: '#3b82f6',
              }}>
                📌 내 파일
              </span>
            )}
            {alreadyOwns && !isMyDocument && (
              <span style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: '0.85rem',
                fontWeight: 600,
                background: 'rgba(168,85,247,0.2)',
                color: '#a855f7',
              }}>
                🎫 구매완료
              </span>
            )}
          </div>

          {/* 제목 */}
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: 16,
          }}>
            {document.title}
          </h1>

          {/* 설명 */}
          <p style={{
            fontSize: '1.1rem',
            color: '#ffffff',
            lineHeight: 1.8,
            marginBottom: 32,
            opacity: 0.9,
          }}>
            {document.description}
          </p>

          {/* 정보 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            marginBottom: 32,
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: 20,
              borderRadius: 12,
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: '#ffffff',
                marginBottom: 8,
                opacity: 0.7,
              }}>
                💰 가격
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--accent)',
              }}>
                {document.price_per_token} ETH
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: 20,
              borderRadius: 12,
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: '#ffffff',
                marginBottom: 8,
                opacity: 0.7,
              }}>
                🔢 남은 수량
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ffffff',
              }}>
                {document.amount}개
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: 20,
              borderRadius: 12,
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: '#ffffff',
                marginBottom: 8,
                opacity: 0.7,
              }}>
                👤 판매자
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#ffffff',
                fontFamily: 'monospace',
              }}>
                {short(document.seller)}
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: 20,
              borderRadius: 12,
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: '#ffffff',
                marginBottom: 8,
                opacity: 0.7,
              }}>
                📅 등록일
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#ffffff',
              }}>
                {new Date(document.created_at).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>

          {/* 내 파일인 경우 - 다운로드 버튼만 */}
          {isMyDocument && (
            <div style={{
              background: 'rgba(59,130,246,0.1)',
              padding: 24,
              borderRadius: 12,
              border: '1px solid rgba(59,130,246,0.3)',
            }}>
              <div style={{
                fontSize: '1rem',
                color: '#ffffff',
                marginBottom: 16,
                textAlign: 'center',
              }}>
                📌 내가 등록한 파일입니다
              </div>
              <button
                onClick={handleDownload}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'var(--primary)',
                }}
              >
                📥 파일 다운로드
              </button>
            </div>
          )}

          {/* 이미 구매한 경우 - 다운로드 버튼만 */}
          {!isMyDocument && alreadyOwns && (
            <div style={{
              background: 'rgba(168,85,247,0.1)',
              padding: 24,
              borderRadius: 12,
              border: '1px solid rgba(168,85,247,0.3)',
            }}>
              <div style={{
                fontSize: '1rem',
                color: '#ffffff',
                marginBottom: 16,
                textAlign: 'center',
              }}>
                🎫 이미 구매한 파일입니다
              </div>
              <button
                onClick={handleDownload}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'var(--primary)',
                }}
              >
                📥 파일 다운로드
              </button>
            </div>
          )}

          {/* 구매 가능한 경우 - 구매 영역 */}
          {!isMyDocument && !alreadyOwns && document.is_active && document.amount > 0 && userAddress && (
            <div style={{
              background: 'rgba(79,157,255,0.1)',
              padding: 24,
              borderRadius: 12,
              border: '1px solid rgba(79,157,255,0.3)',
            }}>
              <div style={{
                display: 'flex',
                gap: 16,
                alignItems: 'end',
                marginBottom: 16,
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    marginBottom: 8,
                  }}>
                    🔢 구매 수량
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={document.amount}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: '#ffffff',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    marginBottom: 8,
                  }}>
                    💳 총 가격
                  </label>
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(79,157,255,0.3)',
                    borderRadius: 8,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
                  }}>
                    {totalPrice} ETH
                  </div>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  cursor: purchasing ? 'not-allowed' : 'pointer',
                  opacity: purchasing ? 0.6 : 1,
                }}
              >
                {purchasing ? '⏳ 구매 처리 중...' : '🛒 구매하기'}
              </button>
            </div>
          )}

          {!userAddress && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              padding: 20,
              borderRadius: 12,
              border: '1px solid rgba(239,68,68,0.3)',
              textAlign: 'center',
              color: '#ef4444',
            }}>
              ⚠️ 파일을 다운로드하려면 먼저 지갑을 연결해주세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
