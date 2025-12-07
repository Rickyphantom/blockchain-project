'use client';

import { useState } from 'react';
import { registerDocument } from '@/lib/useDocuTrade';
import { uploadDocument } from '@/lib/supabase';
import { getSigner } from '@/lib/web3';

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerToken, setPricePerToken] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [amount, setAmount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [docId, setDocId] = useState('');

  const handleUpload = async () => {
    if (!title || !description || !pricePerToken || !pdfUrl) {
      alert('모든 필드를 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      const signer = await getSigner();
      const seller = await signer.getAddress();

      // ✅ docId를 number로 변환 (string이면 parseInt 사용)
      const newDocId: number = docId ? parseInt(docId, 10) : Math.floor(Date.now() / 1000);

      // 1️⃣ 블록체인에 등록
      console.log('블록체인 등록 중...');
      const txHash = await registerDocument(
        newDocId,
        Number(amount),
        title,
        pdfUrl,
        description
      );
      console.log('블록체인 등록 완료:', txHash);

      // 2️⃣ DB에 저장
      console.log('DB 저장 중...');
      await uploadDocument(
        newDocId,
        title,
        seller,
        pdfUrl,
        description,
        pricePerToken,
        Number(amount)
      );
      console.log('DB 저장 완료');

      alert(`✅ 업로드 성공!\n\n📄 Document ID: ${newDocId}\n⛓️ TX: ${txHash.slice(0, 20)}...`);

      // 폼 초기화
      setTitle('');
      setDescription('');
      setPricePerToken('');
      setPdfUrl('');
      setAmount('1');
      setDocId('');
    } catch (error) {
      console.error('업로드 실패:', error);
      alert(
        `❌ 실패: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <h1>📤 문서 업로드</h1>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>제목 *</strong>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 스마트 컨트랙트 개발 가이드"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>설명 *</strong>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="문서에 대한 상세 설명을 작성해주세요"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minHeight: '120px',
            boxSizing: 'border-box',
            fontFamily: 'Arial',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>PDF URL *</strong>
        </label>
        <input
          type="url"
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
          placeholder="https://example.com/document.pdf"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            <strong>토큰당 가격 (ETH) *</strong>
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
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            <strong>발행량</strong>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1"
            min="1"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '15px', marginTop: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          <strong>Document ID (선택, 자동 생성됨)</strong>
        </label>
        <input
          type="number"
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
          placeholder="자동 생성됨"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box',
            color: '#666',
          }}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          marginTop: '20px',
        }}
      >
        {loading ? '⏳ 처리 중... (1-2분 소요)' : '🚀 업로드하기'}
      </button>

      {loading && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <p style={{ margin: '0' }}>
            ⏳ 블록체인 트랜잭션 처리 중입니다...
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
            MetaMask 승인 대기 중
          </p>
        </div>
      )}
    </div>
  );
}
