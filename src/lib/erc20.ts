import { ethers } from 'ethers';
import { getSigner } from './web3';

// 표준 ERC-20 ABI
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

/**
 * ERC-20 토큰 컨트랙트 인스턴스 가져오기
 */
export async function getERC20Contract(tokenAddress: string) {
  const signer = await getSigner();
  return new ethers.Contract(tokenAddress, ERC20_ABI, signer);
}

/**
 * 읽기 전용 ERC-20 컨트랙트
 */
export async function getERC20ContractReadOnly(tokenAddress: string) {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  return new ethers.Contract(tokenAddress, ERC20_ABI, provider);
}

/**
 * 토큰 잔액 조회
 */
export async function getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
  try {
    console.log('💰 토큰 잔액 조회 중...');
    console.log('  - 토큰 주소:', tokenAddress);
    console.log('  - 사용자 주소:', userAddress);
    
    const contract = await getERC20ContractReadOnly(tokenAddress);
    const balance = await contract.balanceOf(userAddress);
    const formatted = ethers.formatEther(balance);
    
    console.log('  - Raw 잔액:', balance.toString());
    console.log('  - 포맷된 잔액:', formatted);
    
    return formatted;
  } catch (error) {
    console.error('❌ 토큰 잔액 조회 실패:', error);
    return '0';
  }
}

/**
 * 토큰 정보 조회 (이름, 심볼, decimals)
 */
export async function getTokenInfo(tokenAddress: string) {
  try {
    const contract = await getERC20ContractReadOnly(tokenAddress);
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals()
    ]);
    
    return { name, symbol, decimals: Number(decimals) };
  } catch (error) {
    console.error('토큰 정보 조회 실패:', error);
    return { name: 'Unknown', symbol: 'UNK', decimals: 18 };
  }
}

/**
 * 허용량(Allowance) 조회
 * @param tokenAddress - ERC-20 토큰 주소
 * @param ownerAddress - 토큰 소유자
 * @param spenderAddress - 사용 권한을 받을 주소 (컨트랙트)
 */
export async function getAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<string> {
  try {
    const contract = await getERC20ContractReadOnly(tokenAddress);
    const allowance = await contract.allowance(ownerAddress, spenderAddress);
    return ethers.formatEther(allowance);
  } catch (error) {
    console.error('Allowance 조회 실패:', error);
    return '0';
  }
}

/**
 * 토큰 사용 승인 (Approve)
 * NFT 구매 전 반드시 호출해야 함!
 * 
 * @param tokenAddress - ERC-20 토큰 주소
 * @param spenderAddress - 승인할 주소 (DocuTrade 컨트랙트)
 * @param amount - 승인 금액 (ETH 형식 문자열)
 */
export async function approveToken(
  tokenAddress: string,
  spenderAddress: string,
  amount: string
) {
  try {
    const contract = await getERC20Contract(tokenAddress);
    const amountInWei = ethers.parseEther(amount);

    const tx = await contract.approve(spenderAddress, amountInWei);
    console.log('Approve 트랜잭션 전송:', tx.hash);
    const receipt = await tx.wait();
    console.log('Approve 완료:', receipt);

    return tx.hash;
  } catch (error) {
    console.error('Approve 실패:', error);
    throw error;
  }
}

/**
 * 무제한 승인 (Approve Max)
 * 매번 approve 하지 않도록 최대값으로 승인
 */
export async function approveTokenMax(tokenAddress: string, spenderAddress: string) {
  try {
    const contract = await getERC20Contract(tokenAddress);
    const maxAmount = ethers.MaxUint256;

    const tx = await contract.approve(spenderAddress, maxAmount);
    console.log('Max Approve 트랜잭션 전송:', tx.hash);
    const receipt = await tx.wait();
    console.log('Max Approve 완료:', receipt);

    return tx.hash;
  } catch (error) {
    console.error('Max Approve 실패:', error);
    throw error;
  }
}

/**
 * 토큰 전송
 * @param tokenAddress - ERC-20 토큰 주소
 * @param toAddress - 받는 주소
 * @param amount - 전송 금액 (ETH 형식 문자열)
 */
export async function transferToken(
  tokenAddress: string,
  toAddress: string,
  amount: string
) {
  try {
    const contract = await getERC20Contract(tokenAddress);
    const amountInWei = ethers.parseEther(amount);

    const tx = await contract.transfer(toAddress, amountInWei);
    console.log('Transfer 트랜잭션 전송:', tx.hash);
    const receipt = await tx.wait();
    console.log('Transfer 완료:', receipt);

    return tx.hash;
  } catch (error) {
    console.error('Transfer 실패:', error);
    throw error;
  }
}
