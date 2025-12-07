// app/upload/page.tsx
'use client';

import { useState } from 'react';
import { registerDocument } from '@/lib/useDocuTrade';
import { uploadDocument, uploadPdfFile } from '@/lib/supabase';
import { getSigner } from '@/lib/web3';

// 최대 파일 크기: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerToken, setPricePerToken] = useState('');
  const [amount, setAmount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // 파일 검증 함수
  const validateFile = (selectedFile: File): boolean => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      alert(`파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / (1024 * 1024)}MB까지 업로드 가능합니다.`);
      return false;
    }
    return true;
  };

  // 드래그 이벤트 핸들러
  const handleDrag = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // 드롭 이벤트 핸들러
  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  // 업로드 핸들러
  const handleUpload = async (): Promise<void> => {
    if (!title || !description || !pricePerToken || !file) {
      alert('모든 필드를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      
      // Signer와 주소를 명확하게 가져오기
      const signer = await getSigner();
      const sellerAddress = await signer.getAddress();
      
      console.log('Seller address:', sellerAddress);
      
      if (!sellerAddress || sellerAddress === '0x') {
        throw new Error('지갑 주소를 가져올 수 없습니다. MetaMask를 확인해주세요.');
      }

      const newDocId = Math.floor(Date.now() / 1000);

      // 1. 파일 업로드
      console.log('1. Uploading file...');
      const fileUrl = await uploadPdfFile(file, newDocId);
      console.log('File uploaded:', fileUrl);
      
      // 2. 블록체인에 등록 (매개변수 순서 수정)
      console.log('2. Registering on blockchain...');
      const txHash = await registerDocument(
        title,           // string
        fileUrl,         // string
        description,     // string
        pricePerToken,   // string (ETH 가격)
        Number(amount)   // number
      );
      console.log('Transaction hash:', txHash);
      
      // 3. DB에 저장
      console.log('3. Saving to database...');
      await uploadDocument(
        newDocId,
        title,
        sellerAddress,
        fileUrl,
        description,
        pricePerToken,
        Number(amount)
      );
      console.log('Saved to database');

      alert(`✅ 업로드 성공!\n\n📄 Document ID: ${newDocId}\n⛓️ TX: ${txHash.slice(0, 20)}...`);

      setTitle('');
      setDescription('');
      setPricePerToken('');
      setAmount('1');
      setFile(null);
    } catch (error) {
      console.error('업로드 실패:', error);
      alert(`❌ 실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // 파일 크기 포맷 함수
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
      <h1 className="h1" style={{ marginBottom: 20, fontSize: 22 }}>📤 문서 업로드</h1>

      <style jsx>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 1 !important;
          height: 20px;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        .input-field {
          padding: 10px;
          border-radius: 6px;
          border: none;
          background: rgba(255,255,255,0.05);
          font-size: 12px;
          color: #e8e6e3;
          width: 100%;
          transition: all 0.2s ease;
          outline: none;
        }
        .input-field:focus {
          background: rgba(255,255,255,0.08);
          box-shadow: inset 0 0 8px rgba(212,175,55,0.15);
        }
        .input-field::placeholder {
          color: rgba(176, 184, 204, 0.5);
        }
        textarea.input-field {
          resize: vertical;
          font-family: inherit;
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        {/* 좌측: 입력 폼 */}
        <div className="card" style={{ padding: 14 }}>
          {/* 제목 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 3, fontWeight: 600 }}>📝 제목</div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 스마트 컨트랙트 가이드"
              className="input-field"
              style={{ maxWidth: '500px' }}
            />
          </div>

          {/* 설명 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 3, fontWeight: 600 }}>📋 설명</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="문서에 대한 상세 설명"
              className="input-field"
              style={{ 
                minHeight: 80,
                maxWidth: '500px'
              }}
            />
          </div>

          {/* 가격과 수량 */}
          <div style={{ maxWidth: '500px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 3, fontWeight: 600 }}>💰 가격</div>
                <input
                  type="number"
                  value={pricePerToken}
                  onChange={(e) => setPricePerToken(e.target.value)}
                  placeholder="0.01"
                  step="0.01"
                  min="0"
                  className="input-field"
                />
              </div>

              <div>
                <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 3, fontWeight: 600 }}>🔢 수량</div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1"
                  min="1"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* 드래그 앤 드롭 영역 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 3, fontWeight: 600 }}>📁 파일</div>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                padding: 16,
                borderRadius: 6,
                border: `none`,
                background: dragActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                maxWidth: '500px',
                boxShadow: dragActive ? 'inset 0 0 8px rgba(212,175,55,0.15)' : 'none'
              }}
            >
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
                {file ? (
                  <div>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                    <div style={{ fontSize: 12, fontWeight: 600, wordBreak: 'break-all', color: '#e8e6e3' }}>{file.name}</div>
                    <div style={{ fontSize: 10, color: '#b0b8cc', marginTop: 3 }}>
                      {formatFileSize(file.size)}
                    </div>
                    <div style={{ fontSize: 9, color: '#b0b8cc', marginTop: 4 }}>
                      클릭해서 변경
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, color: '#e8e6e3' }}>
                      파일을 드래그하거나
                    </div>
                    <div style={{ fontSize: 10, color: '#b0b8cc' }}>
                      클릭해서 선택
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* 업로드 버튼 */}
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              maxWidth: '500px',
              padding: '10px 14px', 
              fontSize: 13, 
              fontWeight: 700, 
              height: 40,
              borderRadius: 6
            }}
          >
            {loading ? '⏳ 업로드 중...' : '🚀 업로드하기'}
          </button>

          {/* 로딩 메시지 */}
          {loading && (
            <div style={{ 
              marginTop: 10, 
              padding: 10, 
              borderRadius: 6, 
              background: 'rgba(255,255,255,0.05)', 
              maxWidth: '500px'
            }}>
              <div style={{ fontSize: 11, color: '#e8e6e3' }}>
                ⏳ 블록체인 트랜잭션 처리 중...
              </div>
            </div>
          )}
        </div>

        {/* 우측: 미리보기 */}
        <div className="card" style={{ padding: 14 }}>
          <h2 className="h2" style={{ marginBottom: 12, fontSize: 14 }}>📋 미리보기</h2>

          {file ? (
            <div>
              {/* 파일 정보 */}
              <div style={{
                padding: 16,
                borderRadius: 6,
                background: 'rgba(255,255,255,0.05)',
                marginBottom: 12,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, wordBreak: 'break-all' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 10, color: '#b0b8cc' }}>
                  {formatFileSize(file.size)}
                </div>
              </div>

              {/* 입력 정보 미리보기 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: 10, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 3, fontWeight: 600 }}>📝 제목</div>
                  <div style={{ fontSize: 12, fontWeight: 600, wordBreak: 'break-word' }}>
                    {title || '(입력 대기 중)'}
                  </div>
                </div>

                <div style={{ padding: 10, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 3, fontWeight: 600 }}>📋 설명</div>
                  <div style={{ fontSize: 11, wordBreak: 'break-word' }}>
                    {description || '(입력 대기 중)'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: 10, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 3, fontWeight: 600 }}>💰 가격</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {pricePerToken ? `${pricePerToken} ETH` : '—'}
                    </div>
                  </div>

                  <div style={{ padding: 10, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 10, color: '#d4af37', marginBottom: 3, fontWeight: 600 }}>🔢 수량</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{amount}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#b0b8cc' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
              <div style={{ fontSize: 12 }}>파일을 선택하면</div>
              <div style={{ fontSize: 12 }}>미리보기가 표시됩니다</div>
            </div>
          )}

          {/* 안내 정보 */}
          <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 10, color: '#b0b8cc', lineHeight: 1.5 }}>
              💡 최대 50MB, PDF/Word/이미지 지원
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
