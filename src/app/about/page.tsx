'use client';

export default function About() {
  const teamMembers = [
    {
      name: '유선빈',
      studentId: '92113724',
      role: 'Full-Stack Developer',
      image: '/게토 스구루.jpg',
      description: 'Database 설계, Frontend 개발 및 기타 작업 담당',
      responsibilities: ['데이터베이스 설계', 'Frontend 개발', '프로젝트 통합'],
    },
    {
      name: '김영욱',
      studentId: '92212788',
      role: 'Blockchain Developer',
      image: '/고죠사토루.jpg',
      description: '프로젝트 아이디어 제시 및 Solidity 스마트 컨트랙트 개발',
      responsibilities: ['프로젝트 기획', 'Smart Contract 개발', 'Blockchain 로직'],
    },
  ];

  const techStack = [
    {
      category: 'Frontend',
      icon: '🎨',
      technologies: [
        { name: 'Next.js 16', description: 'React 프레임워크' },
        { name: 'TypeScript', description: '타입 안정성' },
        { name: 'React', description: 'UI 라이브러리' },
      ],
    },
    {
      category: 'Blockchain',
      icon: '⛓️',
      technologies: [
        { name: 'Solidity', description: '스마트 컨트랙트' },
        { name: 'Ethers.js', description: 'Ethereum 상호작용' },
        { name: 'Hardhat', description: '개발 환경' },
      ],
    },
    {
      category: 'Backend & Database',
      icon: '💾',
      technologies: [
        { name: 'Supabase', description: 'PostgreSQL 데이터베이스' },
        { name: 'Node.js', description: '런타임 환경' },
      ],
    },
    {
      category: 'Tools',
      icon: '🛠️',
      technologies: [
        { name: 'MetaMask', description: '지갑 연결' },
        { name: 'Git/GitHub', description: '버전 관리' },
        { name: 'VS Code', description: '개발 도구' },
      ],
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      padding: '80px 20px 40px',
      background: 'linear-gradient(135deg, #0f1724 0%, #071022 100%)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 팀 사진 섹션 */}
        <div style={{
          marginBottom: 60,
          background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
          borderRadius: 16,
          padding: 40,
          border: '1px solid rgba(255,255,255,0.08)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '100%',
            maxWidth: 600,
            margin: '0 auto',
            borderRadius: 12,
            overflow: 'hidden',
            border: '2px solid rgba(79,157,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <img 
              src="/두사람은문제아지만최강.jpg"
              alt="두 사람은 문제아지만 최강"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* 팀원 카드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 32,
          maxWidth: 800,
          margin: '0 auto 60px',
        }}>
          {teamMembers.map((member, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                borderRadius: 16,
                padding: 32,
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(79,157,255,0.3)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(79,157,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
              }}
            >
              {/* 캐릭터 이미지 */}
              <div style={{
                width: 120,
                height: 120,
                margin: '0 auto 20px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid',
                borderImage: 'linear-gradient(135deg, var(--accent), var(--primary)) 1',
                boxShadow: '0 8px 24px rgba(79,157,255,0.3)',
                background: 'linear-gradient(135deg, var(--accent), var(--primary))',
              }}>
                <img 
                  src={member.image}
                  alt={member.character}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>

              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: 4,
                color: 'var(--text-primary)',
                textAlign: 'center',
              }}>
                {member.name}
              </h3>

              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginBottom: 8,
                fontFamily: 'monospace',
              }}>
                {member.studentId}
              </div>

              <div style={{
                fontSize: '0.95rem',
                color: 'var(--accent)',
                fontWeight: 500,
                marginBottom: 4,
                textAlign: 'center',
              }}>
                {member.role}
              </div>
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: 16,
                textAlign: 'center',
              }}>
                {member.description}
              </p>

              <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 8,
                padding: 16,
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  marginBottom: 8,
                }}>
                  📋 담당 업무
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}>
                  {member.responsibilities.map((resp, idx) => (
                    <li key={idx} style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 4,
                      paddingLeft: 16,
                      position: 'relative',
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: 'var(--accent)',
                      }}>•</span>
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* 기술 스택 섹션 */}
        <div style={{
          marginTop: 60,
          marginBottom: 60,
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 600,
            marginBottom: 40,
            textAlign: 'center',
            color: 'var(--text-primary)',
          }}>
            🛠️ 사용 기술
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {techStack.map((stack, index) => (
              <div
                key={index}
                style={{
                  background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,36,0.4))',
                  borderRadius: 16,
                  padding: 24,
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
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
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                }}>
                  <div style={{
                    fontSize: '2rem',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(79,157,255,0.1)',
                    borderRadius: 12,
                  }}>
                    {stack.icon}
                  </div>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {stack.category}
                  </h3>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  {stack.technologies.map((tech, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--accent)',
                        marginBottom: 4,
                      }}>
                        {tech.name}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                      }}>
                        {tech.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

     
      </div>
    </div>
  );
}