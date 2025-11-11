// src/lib/web3.ts
import { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;

  // 이벤트별 오버로드(정확한 핸들러 타입)
  on?(event: 'accountsChanged', handler: (accounts: string[]) => void): void;
  on?(event: 'chainChanged', handler: (chainId: string) => void): void;
  on?(event: string, handler: (...args: unknown[]) => void): void;

  removeListener?(
    event: 'accountsChanged',
    handler: (accounts: string[]) => void
  ): void;
  removeListener?(
    event: 'chainChanged',
    handler: (chainId: string) => void
  ): void;
  removeListener?(
    event: string,
    handler: (...args: unknown[]) => void
  ): void;
}

export interface EthereumWindow extends Window {
  ethereum?: EthereumProvider;
}

export const SEPOLIA = {
  chainIdHex: '0xAA36A7',
  explorerForAddress: (addr: string) =>
    `https://sepolia.etherscan.io/address/${addr}`,
};

export function hasMetaMask(): boolean {
  return typeof window !== 'undefined' && !!(window as EthereumWindow).ethereum;
}

export async function ensureSepolia(): Promise<void> {
  const eth = (window as EthereumWindow).ethereum;
  if (!eth) throw new Error('MetaMask가 필요합니다.');
  await eth.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: SEPOLIA.chainIdHex }],
  });
}

/** 🔧 브라우저에서는 BrowserProvider 를 써야 합니다. */
export async function getProvider(): Promise<BrowserProvider> {
  return new BrowserProvider((window as EthereumWindow).ethereum!);
}

export async function getSigner(): Promise<JsonRpcSigner> {
  const p = await getProvider();
  return p.getSigner();
}
