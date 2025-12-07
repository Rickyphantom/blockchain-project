// components/ConnectCard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { EthereumWindow } from '@/lib/web3';

export default function ConnectCard() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const eth = (window as EthereumWindow).ethereum;
        if (!eth) return;

        const accounts = await eth.request({ 
          method: 'eth_accounts',
          params: []
        }) as string[];
        
        if (accounts?.[0]) {
          setAddress(accounts[0]);
        }

        eth.on?.('accountsChanged', (accounts: unknown) => {
          const accs = accounts as string[];
          setAddress(accs?.[0] ?? null);
        });

        eth.on?.('chainChanged', (chainId: unknown) => {
          console.log('Chain changed:', chainId);
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div>
      {address ? (
        <div>연결됨: {address.slice(0, 6)}...{address.slice(-4)}</div>
      ) : (
        <div>연결 안 됨</div>
      )}
    </div>
  );
}
