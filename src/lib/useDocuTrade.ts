import { ethers } from 'ethers';
import { getSigner } from './web3';
import DocuTradeABI from '@/contracts/DocuTrade.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

export async function getDocuTradeContract() {
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, DocuTradeABI as any, signer);
}

export async function getDocuTradeContractReadOnly() {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, DocuTradeABI as any, provider);
}

// 문서 등록
export async function registerDocument(
  title: string,
  fileUrl: string,
  description: string,
  price: string,
  amount: number
) {
  try {
    const contract = await getDocuTradeContract();
    const priceInWei = ethers.parseEther(price);

    const tx = await contract.registerDocument(
      title,
      fileUrl,
      description,
      priceInWei,
      amount
    );

    console.log('트랜잭션 전송:', tx.hash);
    const receipt = await tx.wait();
    console.log('트랜잭션 완료:', receipt);

    return tx.hash;
  } catch (error) {
    console.error('문서 등록 실패:', error);
    throw error;
  }
}

// 문서 구매
export async function buyDocuments(
  docId: number,
  quantity: number,
  pricePerToken: string
) {
  try {
    const contract = await getDocuTradeContract();
    const totalPrice = ethers.parseEther(pricePerToken) * BigInt(quantity);

    const tx = await contract.buyDocuments(docId, quantity, {
      value: totalPrice,
    });

    console.log('구매 트랜잭션:', tx.hash);
    const receipt = await tx.wait();
    console.log('구매 완료:', receipt);

    return tx.hash;
  } catch (error) {
    console.error('구매 실패:', error);
    throw error;
  }
}

// 사용자의 모든 NFT 조회
export async function getUserNFTs(userAddress: string): Promise<number[]> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    const nfts = await contract.getUserNFTs(userAddress);
    return nfts.map((id: any) => Number(id));
  } catch (error) {
    console.error('NFT 조회 실패:', error);
    return [];
  }
}

// NFT로 문서 정보 조회
export async function getDocumentByToken(tokenId: number) {
  try {
    const contract = await getDocuTradeContractReadOnly();
    const doc = await contract.getDocumentByToken(tokenId);
    
    return {
      docId: Number(doc.docId),
      title: doc.title,
      fileUrl: doc.fileUrl,
      description: doc.description,
      seller: doc.seller,
      pricePerToken: ethers.formatEther(doc.pricePerToken),
      amount: Number(doc.amount),
      isActive: doc.isActive,
    };
  } catch (error) {
    console.error('문서 조회 실패:', error);
    throw error;
  }
}

// 문서 소유 여부 확인
export async function ownsDocument(userAddress: string, docId: number): Promise<boolean> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    return await contract.ownsDocument(userAddress, docId);
  } catch (error) {
    console.error('소유권 확인 실패:', error);
    return false;
  }
}

// NFT 소유자 조회
export async function getNFTOwner(tokenId: number): Promise<string | null> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    return await contract.ownerOf(tokenId);
  } catch (error) {
    console.error('NFT 소유자 조회 실패:', error);
    return null;
  }
}

// 컨트랙트 정보 조회
export async function getContractInfo() {
  try {
    const contract = await getDocuTradeContractReadOnly();
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalDocs = await contract.getTotalDocuments();
    
    return {
      name,
      symbol,
      totalDocs: Number(totalDocs),
      address: CONTRACT_ADDRESS,
    };
  } catch (error) {
    console.error('컨트랙트 정보 조회 실패:', error);
    throw error;
  }
}

// 사용자의 문서 목록 조회
export async function getUserDocuments(userAddress: string): Promise<number[]> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    const docs = await contract.getUserDocuments(userAddress);
    return docs.map((id: any) => Number(id));
  } catch (error) {
    console.error('사용자 문서 조회 실패:', error);
    return [];
  }
}

// 문서 상세 정보 조회
export async function getDocument(docId: number) {
  try {
    const contract = await getDocuTradeContractReadOnly();
    const doc = await contract.getDocument(docId);
    
    return {
      docId: Number(doc.docId),
      title: doc.title,
      fileUrl: doc.fileUrl,
      description: doc.description,
      seller: doc.seller,
      pricePerToken: ethers.formatEther(doc.pricePerToken),
      amount: Number(doc.amount),
      isActive: doc.isActive,
    };
  } catch (error) {
    console.error('문서 조회 실패:', error);
    throw error;
  }
}

// 전체 문서 수 조회
export async function getTotalDocuments(): Promise<number> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    const total = await contract.getTotalDocuments();
    return Number(total);
  } catch (error) {
    console.error('전체 문서 수 조회 실패:', error);
    return 0;
  }
}