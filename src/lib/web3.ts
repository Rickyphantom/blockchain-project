// src/lib/web3.ts
import { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: 'accountsChanged' | 'chainChanged' | string, handler: (args: unknown) => void): void;
  removeListener?(event: 'accountsChanged' | 'chainChanged' | string, handler: (args: unknown) => void): void;
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

export async function getProvider(): Promise<BrowserProvider> {
  return new BrowserProvider((window as EthereumWindow).ethereum!);
}

export async function getSigner(): Promise<JsonRpcSigner> {
  const p = await getProvider();
  return p.getSigner();
}
