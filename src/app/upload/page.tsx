'use client';

import { useState } from 'react';
import { registerDocument } from '@/lib/useDocuTrade';
import { uploadDocument, uploadPdfFile } from '@/lib/supabase';
import { getSigner } from '@/lib/web3';

// 지원하는 파일 형식
const ALLOWED_TYPES = {
  'application/pdf': { label: 'PDF', icon: '📄' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    label: 'Word (.docx)',
    icon: '📝',
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    label: 'Excel (.xlsx)',
    icon: '📊',
  },
  'text/plain': { label: 'Text (.txt)', icon: '📃' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    label: 'PowerPoint (.pptx)',
    icon: '🎨',
  },
  'image/png': { label: 'PNG 이미지', icon: '🖼️' },
  'image/jpeg': { label: 'JPG 이미지', icon: '🖼️' },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerToken, setPricePerToken] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateAndSetFile = (inputFile: File | null | undefined) => {
    if (!inputFile) return;

    // 파일 형식 검증
    if (!ALLOWED_TYPES[inputFile.type as keyof typeof ALLOWED_TYPES]) {
      const supportedFormats = Object.values(ALLOWED_TYPES)
        .map((f) => f.label)
        .join(', ');
      alert(`❌ 지원하지 않는 파일 형식입니다.\n\n지원 형식: ${supportedFormats}`);
      return;
    }

    // 파일 크기 검증
    if (inputFile.size > MAX_FILE_SIZE) {
      alert(`❌ 파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다`);
      return;
    }

    setFile(inputFile);
    setProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputFile = e.target.files?.[0];
    validateAndSetFile(inputFile);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!title || !description || !pricePerToken || !file) {
      alert('⚠️ 모든 필드를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      const signer = await getSigner();
      const seller = await signer.getAddress();

      // Document ID 생성
      const newDocId: number = Math.floor(Date.now() / 1000);

      // 1️⃣ 파일 업로드 (확장자 유지)
      console.log('📤 파일 업로드 중...');
      setProgress(33);
      const fileUrl = await uploadFileToSupabase(file, newDocId);
      console.log('✅ 파일 업로드 완료:', fileUrl);

      // 2️⃣ 블록체인에 등록
      console.log('⛓️ 블록체인 등록 중...');
      setProgress(66);
      const txHash = await registerDocument(
        newDocId,
        Number(amount),
        title,
        fileUrl,
        description
      );
      console.log('✅ 블록체인 등록 완료:', txHash);

      // 3️⃣ DB에 저장
      console.log('💾 DB 저장 중...');
      setProgress(90);
      await uploadDocument(
        newDocId,
        title,
        seller,
        fileUrl,
        description,
        pricePerToken,
        Number(amount)
      );
      console.log('✅ DB 저장 완료');

      setProgress(100);

      alert(
        `✅ 업로드 성공!\n\n📄 Document ID: ${newDocId}\n⛓️ TX: ${txHash.slice(0, 20)}...\n\n마켓에서 확인하세요!`
      );

      // 폼 초기화
      setTitle('');
      setDescription('');
      setPricePerToken('');
      setFile(null);
      setAmount('1');
      setProgress(0);
    } catch (error) {
      console.error('업로드 실패:', error);
      alert(
        `❌ 실패: ${error instanceof Error ? error.message : String(error)}`
      );
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // 파일을 Supabase Storage에 업로드
  const uploadFileToSupabase = async (
    inputFile: File,
    docId: number
  ): Promise<string> => {
    const { uploadPdfFile } = await import('@/lib/supabase');
    return uploadPdfFile(inputFile, docId);
  };

  const getFileInfo = () => {
    if (!file) return null;
    return ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
  };

  const fileInfo = getFileInfo();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
          📤 문서 업로드
        </h1>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '10px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {/* 제목 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              📝 제목 <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 스마트 컨트랙트 개발 가이드"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                boxSizing: 'border-box',
                fontSize: '14px',
              }}
            />
          </div>

          {/* 설명 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              📝 설명 <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="문서에 대한 상세 설명을 작성해주세요"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                minHeight: '120px',
                boxSizing: 'border-box',
                fontSize: '14px',
              }}
            />
          </div>

          {/* 파일 업로드 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              📎 파일 선택 <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '3px solid #007bff' : '2px dashed #007bff',
                borderRadius: '8px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: dragActive ? '#e7f3ff' : '#f9f9f9',
                transition: 'all 0.3s ease',
              }}
            >
              <input
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'block' }}>
                {file ? (
                  <div>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                      {fileInfo?.icon}
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      {fileInfo?.label} • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <div
                      style={{
                        marginTop: '10px',
                        fontSize: '12px',
                        color: '#007bff',
                        cursor: 'pointer',
                      }}
                      onClick={() => setFile(null)}
                    >
                      다른 파일 선택
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '50px', marginBottom: '15px' }}>📁</div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333', marginBottom: '5px' }}>
                      파일을 여기에 드래그하세요
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                      또는 클릭하여 선택
                    </div>

                    {/* 지원 파일 형식 */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '8px',
                        marginTop: '15px',
                      }}
                    >
                      {Object.values(ALLOWED_TYPES).map((type) => (
                        <div
                          key={type.label}
                          style={{
                            padding: '8px',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '11px',
                            color: '#666',
                          }}
                        >
                          <div style={{ fontSize: '18px', marginBottom: '3px' }}>{type.icon}</div>
                          {type.label}
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: '11px', color: '#999', marginTop: '15px' }}>
                      최대 50MB
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* 가격 및 수량 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                💰 토큰당 가격 (ETH) <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="number"
                value={pricePerToken}
                onChange={(e) => setPricePerToken(e.target.value)}
                placeholder="0.01"
                step="0.001"
                min="0"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                📊 발행량
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1"
                min="1"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* 예상 정보 */}
          {pricePerToken && amount && (
            <div
              style={{
                padding: '15px',
                backgroundColor: '#f0f8ff',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#333',
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <strong>📊 예상 정보:</strong>
              </div>
              <div>
                • 총 발행액: <strong>{(parseFloat(pricePerToken) * parseInt(amount)).toFixed(4)} ETH</strong>
              </div>
            </div>
          )}

          {/* 업로드 버튼 */}
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading || !file ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading || !file ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '15px',
            }}
          >
            {loading ? '⏳ 업로드 중...' : '🚀 업로드하기'}
          </button>

          {/* 진행 상황 */}
          {loading && progress > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: '#666',
                }}
              >
                <span>진행률</span>
                <span>{progress}%</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: '#28a745',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* 로딩 메시지 */}
          {loading && (
            <div
              style={{
                padding: '15px',
                backgroundColor: '#e8f5e9',
                borderRadius: '6px',
                border: '1px solid #4caf50',
                color: '#2e7d32',
                fontSize: '14px',
              }}
            >
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                ⏳ 처리 중입니다...
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                {progress === 0 && '파일 업로드를 시작합니다...'}
                {progress === 33 && '📤 파일을 업로드 중입니다...'}
                {progress === 66 && '⛓️ 블록체인에 등록 중입니다...'}
                {progress === 90 && '💾 데이터베이스에 저장 중입니다...'}
                <br />
                <small>이 과정은 1-3분 정도 소요됩니다</small>
              </div>
            </div>
          )}
        </div>

        {/* 안내 문구 */}
        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#666',
            lineHeight: '1.6',
          }}
        >
          <strong>📌 지원 파일 형식:</strong>
          <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
            <li>📄 PDF</li>
            <li>📝 Word (.docx)</li>
            <li>📊 Excel (.xlsx)</li>
            <li>🎨 PowerPoint (.pptx)</li>
            <li>📃 Text (.txt)</li>
            <li>🖼️ Image (PNG, JPG)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
