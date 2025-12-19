'use client';

import { useState, useEffect } from 'react';
import { connectWallet } from '@/lib/web3';
import {
  requestAirdrop,
  checkAirdropStatus,
  getAirdropAmount,
  getPaymentTokenAddress,
  getContractInfo,
} from '@/lib/useDocuTrade';
import { getTokenBalance, getTokenInfo } from '@/lib/erc20';

export default function AirdropPage() {
  const [account, setAccount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasReceived, setHasReceived] = useState(false);
  const [airdropAmount, setAirdropAmount] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenInfo, setTokenInfo] = useState({ name: '', symbol: '', decimals: 18 });
  const [tokenAddress, setTokenAddress] = useState('');
  const [contractInfo, setContractInfo] = useState({ name: '', symbol: '', address: '' });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (account) {
      checkUserStatus();
    }
  }, [account, tokenAddress]);

  const loadInitialData = async () => {
    try {
      // 컨트랙트 정보 로드
      const info = await getContractInfo();
      setContractInfo(info);
      setAirdropAmount(info.airdropAmount);

      // 토큰 주소 로드
      const paymentToken = await getPaymentTokenAddress();
      setTokenAddress(paymentToken);

      // 토큰 정보 로드
      if (paymentToken) {
        const tokenData = await getTokenInfo(paymentToken);
        setTokenInfo(tokenData);
      }
    } catch (error) {
      console.error('초기 데이터 로드 실패:', error);
    }
  };

  const checkUserStatus = async () => {
    if (!account || !tokenAddress) return;

    try {
      // 에어드랍 수령 여부 확인
      const status = await checkAirdropStatus(account);
      setHasReceived(status);

      // 토큰 잔액 조회
      const balance = await getTokenBalance(tokenAddress, account);
      setTokenBalance(balance);
    } catch (error) {
      console.error('사용자 상태 확인 실패:', error);
    }
  };

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      setAccount(address);
    } catch (error) {
      console.error('지갑 연결 실패:', error);
      alert('지갑 연결에 실패했습니다.');
    }
  };

  const handleRequestAirdrop = async () => {
    if (!account) {
      alert('먼저 지갑을 연결하세요.');
      return;
    }

    if (hasReceived) {
      alert('이미 에어드랍을 받았습니다.');
      return;
    }

    setLoading(true);
    try {
      const txHash = await requestAirdrop();
      alert(`에어드랍 성공!\n트랜잭션: ${txHash}`);
      
      // 상태 업데이트
      setHasReceived(true);
      await checkUserStatus();
    } catch (error: any) {
      console.error('에어드랍 실패:', error);
      alert(`에어드랍 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '60px 40px',
          textAlign: 'center',
          marginBottom: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <h1 style={{ fontSize: '48px', marginBottom: '20px', color: 'white' }}>
          🎁 토큰 에어드랍
        </h1>
        <p style={{ fontSize: '20px', opacity: 0.9, color: 'white' }}>
          무료로 {tokenInfo.symbol || 'Token'}을 받으세요!
        </p>
      </div>

      {/* 컨트랙트 정보 */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--accent)' }}>
          📊 컨트랙트 정보
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          <InfoRow label="NFT 이름" value={contractInfo.name} />
          <InfoRow label="심볼" value={contractInfo.symbol} />
          <InfoRow label="컨트랙트 주소" value={contractInfo.address} />
          <InfoRow 
            label="토큰 주소" 
            value={tokenAddress ? `${tokenAddress.slice(0, 10)}...${tokenAddress.slice(-8)}` : 'Loading...'} 
          />
          <InfoRow label="토큰 이름" value={`${tokenInfo.name} (${tokenInfo.symbol})`} />
          <InfoRow 
            label="에어드랍 금액" 
            value={`${airdropAmount} ${tokenInfo.symbol || 'Tokens'}`} 
          />
        </div>
      </div>

      {/* 지갑 연결 */}
      {!account ? (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <button
            onClick={handleConnect}
            style={{
              padding: '16px 40px',
              fontSize: '18px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
            }}
          >
            🦊 지갑 연결하기
          </button>
        </div>
      ) : (
        <>
          {/* 사용자 정보 */}
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '16px',
              padding: '30px',
              marginBottom: '30px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--accent)' }}>
              👤 내 정보
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <InfoRow 
                label="지갑 주소" 
                value={`${account.slice(0, 10)}...${account.slice(-8)}`} 
              />
              <InfoRow 
                label="토큰 잔액" 
                value={`${parseFloat(tokenBalance).toFixed(2)} ${tokenInfo.symbol}`} 
              />
              <InfoRow 
                label="에어드랍 상태" 
                value={hasReceived ? '✅ 이미 받음' : '❌ 아직 받지 않음'} 
              />
            </div>
          </div>

          {/* 에어드랍 버튼 */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleRequestAirdrop}
              disabled={loading || hasReceived}
              style={{
                padding: '20px 60px',
                fontSize: '20px',
                background: hasReceived 
                  ? '#555' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: hasReceived ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                boxShadow: hasReceived ? 'none' : '0 8px 25px rgba(102, 126, 234, 0.5)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '처리 중...' : hasReceived ? '이미 받음' : '🎁 에어드랍 받기'}
            </button>
            
            {!hasReceived && (
              <p style={{ marginTop: '20px', color: '#888', fontSize: '14px' }}>
                * 1인당 1회만 받을 수 있습니다
              </p>
            )}
          </div>
        </>
      )}

      {/* 안내 사항 */}
      <div
        style={{
          marginTop: '50px',
          padding: '30px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h3 style={{ fontSize: '20px', marginBottom: '15px', color: 'var(--accent)' }}>
          📌 안내사항
        </h3>
        <ul style={{ lineHeight: '2', color: '#ccc', paddingLeft: '20px' }}>
          <li>에어드랍은 지갑당 1회만 받을 수 있습니다</li>
          <li>받은 토큰은 NFT 구매에 사용할 수 있습니다</li>
          <li>Sepolia 테스트넷에서만 작동합니다</li>
          <li>트랜잭션 수수료(가스비)는 별도로 필요합니다</li>
        </ul>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
      }}
    >
      <span style={{ color: '#999', fontWeight: '500' }}>{label}</span>
      <span style={{ color: 'white', fontWeight: 'bold' }}>{value}</span>
    </div>
  );
}
