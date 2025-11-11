// components/ConnectCard.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatEther } from 'ethers';
import {
  EthereumWindow,
  hasMetaMask,
  ensureSepolia,
  getProvider,
  SEPOLIA,
} from '@/lib/web3';

export default function ConnectCard() {
  const [account, setAccount] = useState<string>('');
  const [chainId, setChainId] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');
  const [error, setError] = useState<string>('');

  const connect = useCallback(async () => {
    try {
      setError('');
      if (!hasMetaMask()) throw new Error('MetaMask 확장 프로그램을 설치하세요.');
      await ensureSepolia();

      const provider = await getProvider();

      // send()의 반환은 unknown → 안전한 내로잉
      const result = await provider.send('eth_requestAccounts', []);
      const accs = Array.isArray(result) && result.every((x) => typeof x === 'string')
        ? (result as string[])
        : [];

      if (!accs[0]) throw new Error('계정을 불러오지 못했습니다.');

      setAccount(accs[0]);

      const net = await provider.getNetwork();
      setChainId(`0x${net.chainId.toString(16)}`);

      const bal = await provider.getBalance(accs[0]);
      setBalance(formatEther(bal));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      if (!account) return;
      const provider = await getProvider();
      const bal = await provider.getBalance(account);
      setBalance(formatEther(bal));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [account]);

  useEffect(() => {
    const eth = (window as EthereumWindow).ethereum;
    if (!eth) return;

    // lib/web3.ts의 오버로드 시그니처와 정확히 일치
    const onAcc = (accounts: string[]): void => {
      setAccount(accounts?.[0] ?? '');
    };
    const onChain = (cid: string): void => {
      setChainId(cid);
    };

    eth.on?.('accountsChanged', onAcc);
    eth.on?.('chainChanged', onChain);

    return () => {
      eth.removeListener?.('accountsChanged', onAcc);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, []);

  const short = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : '';
  const explorer = account ? SEPOLIA.explorerForAddress(account) : '#';

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>메타마스크 연결</h2>

      <div style={{ display: 'flex', gap: 12, margin: '8px 0 12px' }}>
        <button className="btn primary" onClick={connect}>MetaMask 연결</button>
        <button className="btn ghost" onClick={refresh} disabled={!account}>잔액 새로고침</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
        <div><div className="label">계정</div><div className="mono">{short || '-'}</div></div>
        <div><div className="label">네트워크</div><div>{chainId || '-'}</div></div>
        <div><div className="label">잔액(ETH)</div><div>{balance}</div></div>
      </div>

      <div style={{ marginTop: 8 }}>
        {account
          ? <a href={explorer} target="_blank" rel="noreferrer" style={{ color: '#6be6ff', textDecoration: 'none', borderBottom: '1px dashed rgba(107,230,255,.5)' }}>Etherscan에서 보기 ↗</a>
          : <span className="label">연결 후 확인 가능</span>}
      </div>

      {error && <div className="error">{error}</div>}
    </section>
  );
}
