import { Contract, parseEther } from 'ethers';
import { getSigner, getProvider } from './web3';
import { DOCTRADE_ABI, DOCTRADE_CONTRACT_ADDRESS } from './docuTradeABI';

export interface DocumentInfo {
  id: number;
  title: string;
  pdfUrl: string;
  description: string;
  author: string;
}

export const registerDocument = async (
  docId: number,
  amount: number,
  title: string,
  fileUrl: string,
  description: string
): Promise<string> => {
  const signer = await getSigner();
  const contract = new Contract(DOCTRADE_CONTRACT_ADDRESS, DOCTRADE_ABI, signer);

  console.log('Registering document:', { docId, amount, title, fileUrl, description });

  // 빈 문자열 체크
  if (!title || title.trim() === '') {
    throw new Error('제목이 비어있습니다');
  }
  if (!description || description.trim() === '') {
    throw new Error('설명이 비어있습니다');
  }
  if (!fileUrl || fileUrl.trim() === '') {
    throw new Error('파일 URL이 비어있습니다');
  }

  const tx = await contract.registerDocument(docId, amount, title, fileUrl, description);
  await tx.wait();
  return tx.hash;
};

// 판매 가격 설정 (Approval 필요)
export async function setSalePrice(
  id: number,
  pricePerToken: string
): Promise<string> {
  const signer = await getSigner();
  const contract = new Contract(
    DOCTRADE_CONTRACT_ADDRESS,
    DOCTRADE_ABI,
    signer
  );

  // pricePerToken을 Wei로 변환
  const priceInWei = parseEther(pricePerToken);
  const tx = await contract.setSalePrice(id, priceInWei);
  const receipt = await tx.wait();
  return receipt?.transactionHash || '';
}

// Approval 설정 (한 번만 필요)
export async function approveContract(): Promise<string> {
  const signer = await getSigner();
  const contract = new Contract(
    DOCTRADE_CONTRACT_ADDRESS,
    DOCTRADE_ABI,
    signer
  );

  const tx = await contract.setApprovalForAll(DOCTRADE_CONTRACT_ADDRESS, true);
  const receipt = await tx.wait();
  return receipt?.transactionHash || '';
}

// 문서 구매
export async function buyDocument(
  id: number,
  seller: string,
  amount: number,
  pricePerToken: string
): Promise<string> {
  const signer = await getSigner();
  const contract = new Contract(
    DOCTRADE_CONTRACT_ADDRESS,
    DOCTRADE_ABI,
    signer
  );

  const totalPrice = parseEther(pricePerToken) * BigInt(amount);
  const tx = await contract.buyDocument(id, seller, amount, {
    value: totalPrice,
  });
  const receipt = await tx.wait();
  return receipt?.transactionHash || '';
}

// 문서 정보 조회
export async function getDocumentInfo(id: number): Promise<DocumentInfo> {
  const provider = await getProvider();
  const contract = new Contract(
    DOCTRADE_CONTRACT_ADDRESS,
    DOCTRADE_ABI,
    provider
  );

  const [title, pdfUrl, description, author] =
    await contract.getDocumentInfo(id);
  return { id, title, pdfUrl, description, author };
}

// 판매 가격 조회
export async function getPrice(
  id: number,
  seller: string
): Promise<string> {
  const provider = await getProvider();
  const contract = new Contract(
    DOCTRADE_CONTRACT_ADDRESS,
    DOCTRADE_ABI,
    provider
  );

  const price = await contract.getPrice(id, seller);
  return price.toString();
}

// 사용자 문서 잔액 확인
export async function getBalance(
  userAddress: string,
  id: number
): Promise<number> {
  const provider = await getProvider();
  const contract = new Contract(
    DOCTRADE_CONTRACT_ADDRESS,
    DOCTRADE_ABI,
    provider
  );

  const balance = await contract.balanceOf(userAddress, id);
  return Number(balance);
}