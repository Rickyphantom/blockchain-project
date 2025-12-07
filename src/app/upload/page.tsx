// app/upload/page.tsx
'use client';

import { useState } from 'react';
import { getSigner } from '@/lib/web3';
import { registerDocument } from '@/lib/useDocuTrade';
import { supabase, uploadPdfFile } from '@/lib/supabase';

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        alert('PDF 파일만 업로드 가능합니다.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    if (!title || !description || !price || !amount) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const amountNum = parseInt(amount);
    if (amountNum <= 0) {
      alert('수량은 1개 이상이어야 합니다.');
      return;
    }

    const priceNum = parseFloat(price);
    if (priceNum <= 0) {
      alert('가격은 0보다 커야 합니다.');
      return;
    }

    try {
      setUploading(true);

      // 1. 지갑 연결 확인
      const signer = await getSigner();
      const address = await signer.getAddress();
      console.log('판매자 주소:', address);

      // 2. 블록체인에 문서 등록
      console.log('블록체인 등록 시작...');
      const docId = await registerDocument(title, 'temp', description, price, amountNum);
      console.log('문서 ID:', docId);

      // 3. Supabase Storage에 파일 업로드
      console.log('파일 업로드 시작...');
      const fileUrl = await uploadPdfFile(file, docId);
      console.log('파일 URL:', fileUrl);

      // 4. Supabase DB에 문서 정보 저장
      console.log('DB 저장 시작...');
      const { data, error } = await supabase.from('documents').insert([
        {
          doc_id: docId,
          title: title,
          description: description,
          seller: address.toLowerCase(),
          file_url: fileUrl,
          price_per_token: price,
          amount: amountNum,
          is_active: true,
        },
      ]).select();

      if (error) {
        console.error('DB 저장 실패:', error);
        throw error;
      }

      console.log('DB 저장 성공:', data);

      alert(`✅ 업로드 완료!\n\n문서 ID: ${docId}\n제목: ${title}\n가격: ${price} ETH\n수량: ${amountNum}개`);

      // 폼 초기화
      setTitle('');
      setDescription('');
      setPrice('');
      setAmount('');
      setFile(null);

      // 대시보드로 이동
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (error) {
      console.error('업로드 실패:', error);
      alert(`❌ 업로드 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '80px 20px 40px',
      background: 'linear-gradient(135deg, #0f1724 0%, #071022 100%)',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 16,
        }}>
          📤 문서 업로드
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          marginBottom: 40,
        }}>
          블록체인에 문서를 등록하고 NFT로 판매하세요
        </p>

        <form onSubmit={handleSubmit} style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
          padding: 32,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* 제목 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              📝 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문서 제목을 입력하세요"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '1rem',
              }}
            />
          </div>

          {/* 설명 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              📄 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="문서에 대한 설명을 입력하세요"
              required
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '1rem',
                resize: 'vertical',
              }}
            />
          </div>

          {/* 가격 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              💰 가격 (ETH)
            </label>
            <input
              type="number"
              step="0.001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.001"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '1rem',
              }}
            />
          </div>

          {/* 수량 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              🔢 판매 수량
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10"
              required
              min="1"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '1rem',
              }}
            />
          </div>

          {/* 파일 업로드 */}
          <div style={{ marginBottom: 32 }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}>
              📎 PDF 파일
            </label>
            <div style={{
              position: 'relative',
              background: 'rgba(0,0,0,0.3)',
              border: '2px dashed rgba(79,157,255,0.3)',
              borderRadius: 8,
              padding: 24,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(79,157,255,0.6)';
              e.currentTarget.style.background = 'rgba(79,157,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(79,157,255,0.3)';
              e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
            }}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>📄</div>
              <div style={{
                fontSize: '1rem',
                color: file ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: file ? 600 : 400,
              }}>
                {file ? file.name : 'PDF 파일을 선택하거나 드래그하세요'}
              </div>
              {file && (
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={uploading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? '⏳ 업로드 중...' : '🚀 등록하기'}
          </button>

          {uploading && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: 'rgba(79,157,255,0.1)',
              borderRadius: 8,
              fontSize: '0.9rem',
              color: 'var(--accent)',
              textAlign: 'center',
            }}>
              💡 MetaMask에서 트랜잭션을 승인해주세요
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
