// app/page.tsx
'use client';

export default function HomePage() {
  return (
    <div>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
        <h1 className="h1">DocuTrade</h1>
        <p className="lead">블록체인으로 문서를 안전하게 거래하세요</p>
      </div>

      {/* 주요 기능 */}
      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: 60 }}>
        {/* 마켓 */}
        <div className="card">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <h2 className="h2">마켓</h2>
          <p className="lead" style={{ marginBottom: 16 }}>
            다양한 문서를 구매하거나 판매하세요. 모든 거래는 블록체인에 기록됩니다.
          </p>
          <a href="/market" className="btn btn-primary" style={{ display: 'inline-block' }}>마켓 보기 →</a>
        </div>

        {/* 등록 */}
        <div className="card">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📤</div>
          <h2 className="h2">문서 등록</h2>
          <p className="lead" style={{ marginBottom: 16 }}>
            당신의 문서를 등록하고 판매하세요. PDF, Word, Excel 등 다양한 형식을 지원합니다.
          </p>
          <a href="/upload" className="btn btn-primary" style={{ display: 'inline-block' }}>등록하기 →</a>
        </div>

        {/* 대시보드 */}
        <div className="card">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <h2 className="h2">대시보드</h2>
          <p className="lead" style={{ marginBottom: 16 }}>
            거래 내역, 판매 통계, 장바구니를 관리하세요. 지갑을 연결하면 모든 정보를 볼 수 있습니다.
          </p>
          <a href="/dashboard" className="btn btn-primary" style={{ display: 'inline-block' }}>대시보드 →</a>
        </div>
      </div>

      {/* 기술 스택 */}
      <div style={{ padding: 28, borderRadius: 12, textAlign: 'center', marginBottom: 60, border: '1px solid rgba(212,175,55,0.15)' }}>
        <h2 className="h2">🔧 기술 스택</h2>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⛓️</div>
            <div className="tag">Smart Contract</div>
            <div style={{ fontSize: 12, color: '#b0b8cc' }}>Solidity</div>
          </div>
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💾</div>
            <div className="tag">데이터베이스</div>
            <div style={{ fontSize: 12, color: '#b0b8cc' }}>Supabase</div>
          </div>
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>☁️</div>
            <div className="tag">파일 저장소</div>
            <div style={{ fontSize: 12, color: '#b0b8cc' }}>Supabase Storage</div>
          </div>
          <div>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
            <div className="tag">블록체인</div>
            <div style={{ fontSize: 12, color: '#b0b8cc' }}>Ethereum Sepolia</div>
          </div>
        </div>
      </div>

      {/* 시작하기 */}
      <div style={{
        border: '1.5px solid rgba(212,175,55,0.2)',
        color: '#ffffff',
        padding: 50,
        borderRadius: 12,
        textAlign: 'center',
        marginBottom: 60
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20 }}>
          🚀 지금 시작하세요!
        </h2>
        <p style={{ fontSize: 16, marginBottom: 30, lineHeight: 1.6, color: '#b0b8cc' }}>
          MetaMask 지갑을 연결하고 문서 거래를 시작하세요.<br />
          복잡한 회원가입은 필요 없습니다.
        </p>
        <a href="/market" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '14px', gap: 6, display: 'inline-block' }}>
          🛒 마켓으로 가기
        </a>
      </div>

      {/* 푸터 */}
      <footer style={{
        textAlign: 'center',
        padding: 30,
        borderTop: '1px solid rgba(212,175,55,0.1)',
        color: '#b0b8cc',
        fontSize: 12
      }}>
        <p style={{ marginBottom: 8 }}>
          © 2025 DocuTrade. 블록체인 기반 문서 거래소
        </p>
        <p>
          Ethereum Sepolia Testnet에서 운영 중입니다.
        </p>
      </footer>
    </div>
  );
}
