import { ethers } from 'ethers';
import { getSigner, getProvider } from './web3';

const DOCUTRADE_ADDRESS = process.env.NEXT_PUBLIC_DOCUTRADE_ADDRESS || '';

// 스마트 컨트랙트 ABI (필요한 함수만)
const DocuTradeABI = [
  'function registerDocument(uint256 docId, uint256 amount, string memory title, string memory fileUrl, string memory description) public',
  'function buyDocuments(uint256 docId, uint256 quantity) public payable',
];

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
  try {
    console.log('registerDocument called with:', { docId, amount, title, fileUrl, description });

    // 1. Signer 가져오기
    const signer = await getSigner();
    
    // 2. 주소 확인
    const sellerAddress = await signer.getAddress();
    console.log('Seller address:', sellerAddress);

    if (!sellerAddress || !ethers.isAddress(sellerAddress)) {
      throw new Error(`유효하지 않은 주소: ${sellerAddress}`);
    }

    // 3. 컨트랙트 인스턴스 생성 (Signer 사용)
    const contract = new ethers.Contract(DOCUTRADE_ADDRESS, DocuTradeABI, signer);
    
    console.log('Contract address:', DOCUTRADE_ADDRESS);
    console.log('Calling registerDocument...');

    // 4. 함수 호출 (입력값 검증)
    if (!title || title.trim() === '') throw new Error('제목이 비어있습니다');
    if (!fileUrl || fileUrl.trim() === '') throw new Error('파일 URL이 비어있습니다');
    if (!description || description.trim() === '') throw new Error('설명이 비어있습니다');

    // 5. 트랜잭션 전송
    const tx = await contract.registerDocument(
      docId,
      amount,
      title,
      fileUrl,
      description
    );

    console.log('Transaction sent:', tx.hash);

    // 6. 트랜잭션 확인 대기
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    return tx.hash;
  } catch (error) {
    console.error('registerDocument error:', error);
    throw error;
  }
};

export const buyDocuments = async (
  docId: number,
  quantity: number,
  pricePerToken: string
): Promise<string> => {
  try {
    const signer = await getSigner();
    const contract = new ethers.Contract(DOCUTRADE_ADDRESS, DocuTradeABI, signer);

    const totalPrice = ethers.parseEther((parseFloat(pricePerToken) * quantity).toString());

    const tx = await contract.buyDocuments(docId, quantity, {
      value: totalPrice,
    });

    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('buyDocuments error:', error);
    throw error;
  }
};

// 문서 정보 조회
export async function getDocumentInfo(id: number): Promise<DocumentInfo> {
  const provider = await getProvider();
  const contract = new ethers.Contract(
    DOCUTRADE_ADDRESS,
    DocuTradeABI,
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
  const contract = new ethers.Contract(
    DOCUTRADE_ADDRESS,
    DocuTradeABI,
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
  const contract = new ethers.Contract(
    DOCUTRADE_ADDRESS,
    DocuTradeABI,
    provider
  );

  const balance = await contract.balanceOf(userAddress, id);
  return Number(balance);
}