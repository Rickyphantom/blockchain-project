// src/lib/web3.ts
import { ethers, BrowserProvider, Eip1193Provider } from 'ethers';

// Ethereum Window 타입 정의
export interface EthereumWindow extends Window {
  ethereum?: Eip1193Provider & {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  };
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

let provider: BrowserProvider | null = null;

export const getProvider = (): BrowserProvider => {
  if (!window.ethereum) {
    throw new Error('MetaMask가 설치되지 않았습니다');
  }
  if (!provider) {
    provider = new BrowserProvider(window.ethereum);
  }
  return provider;
};

export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

export const connectWallet = async (): Promise<string> => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask를 설치해주세요');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
      params: []
    }) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('계정을 찾을 수 없습니다');
    }

    return accounts[0];
  } catch (error) {
    console.error('지갑 연결 실패:', error);
    throw error;
  }
};

export const getAccount = async (): Promise<string | null> => {
  try {
    if (!window.ethereum) return null;

    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
      params: []
    }) as string[];

    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('계정 조회 실패:', error);
    return null;
  }
};

export const switchToSepolia = async (): Promise<void> => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask를 설치해주세요');
    }

    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 4902) {
      await window.ethereum!.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0xaa36a7',
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'SepoliaETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      });
    } else {
      throw error;
    }
  }
};
