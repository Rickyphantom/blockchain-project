// app/page.tsx
'use client';

import Link from 'next/link';

export default function Home() {
  const features = [
    { icon: '🔐', title: '안전한 거래', desc: '스마트 컨트랙트 기반' },
    { icon: '⚡', title: '빠른 처리', desc: 'Ethereum 네트워크 활용' },
    { icon: '💎', title: '투명성', desc: '모든 거래 기록 보존' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #0f1724 0%, #071022 100%)',
    }}>
      <div style={{
        maxWidth: 800,
        textAlign: 'center',
        animation: 'fadeIn 1s ease-in',
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 4rem)',
          fontWeight: 700,
          marginBottom: 24,
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
        }}>
          🔗 DocuTrade
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.3rem)',
          color: 'var(--text-secondary)',
          marginBottom: 48,
          lineHeight: 1.8,
        }}>
          블록체인 기술을 활용한 안전하고 투명한<br />
          분산형 문서 거래 플랫폼
        </p>

        <div style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: 60,
        }}>
          <Link href="/market" className="btn btn-primary" style={{
            padding: '16px 32px',
            fontSize: '1.1rem',
          }}>
            📚 마켓 둘러보기
          </Link>
          <Link href="/upload" className="btn btn-secondary" style={{
            padding: '16px 32px',
            fontSize: '1.1rem',
          }}>
            📤 문서 업로드
          </Link>
        </div>

        {/* 특징 섹션 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 24,
          marginTop: 60,
          marginBottom: 60,
        }}>
          {features.map((feature, idx) => (
            <div
              key={idx}
              style={{
                background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                padding: 24,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(79,157,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{feature.icon}</div>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-primary)',
              }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 팀 소개 버튼 */}
        <div style={{
          marginTop: 60,
          padding: 40,
          background: 'linear-gradient(135deg, rgba(79,157,255,0.1), rgba(99,102,241,0.1))',
          borderRadius: 16,
          border: '1px solid rgba(79,157,255,0.3)',
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 600,
            marginBottom: 16,
            color: 'var(--text-primary)',
          }}>
            👥 우리 팀을 소개합니다
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            marginBottom: 24,
          }}>
            DocuTrade를 만든 개발자들을 만나보세요
          </p>
          <Link href="/about" className="btn btn-primary" style={{
            padding: '14px 28px',
            fontSize: '1rem',
          }}>
            팀 소개 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
