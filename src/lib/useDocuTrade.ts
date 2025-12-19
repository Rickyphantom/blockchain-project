import { ethers } from 'ethers';
import { getSigner } from './web3';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

// 새 컨트랙트 ABI (최소 필수 함수들만 정의)
const DocuTradeABI = [
  // 읽기 함수
  "function paymentToken() view returns (address)",
  "function airdropAmount() view returns (uint256)",
  "function hasReceivedAirdrop(address) view returns (bool)",
  "function listings(uint256) view returns (uint256 tokenId, address seller, uint256 price, bool isValue)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  // 쓰기 함수
  "function requestAirdrop()",
  "function mintNewNFT(string _tokenURI) returns (uint256)",
  "function listNFT(uint256 _tokenId, uint256 _price)",
  "function buyNFT(uint256 _tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function setApprovalForAll(address operator, bool approved)",
  // 이벤트
  "event NFTMinted(uint256 indexed tokenId, address indexed creator, string uri)",
  "event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event NFTSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price)",
  "event AirdropSent(address indexed receiver, uint256 amount)"
];

// 컨트랙트 주소 유효성 검사
if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === 'undefined') {
  console.error('❌ CONTRACT_ADDRESS가 설정되지 않았습니다!');
  console.error('📝 .env.local 파일에 NEXT_PUBLIC_CONTRACT_ADDRESS를 설정하세요.');
}

export async function getDocuTradeContract() {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === 'undefined') {
    throw new Error('컨트랙트 주소가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
  }
  
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, DocuTradeABI, signer);
}

export async function getDocuTradeContractReadOnly() {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === 'undefined') {
    throw new Error('컨트랙트 주소가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
  }
  
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, DocuTradeABI, provider);
}

// ============ 타입 정의 ============
export interface Listing {
  tokenId: number;
  seller: string;
  price: string; // ETH 형식
  isValue: boolean;
}

export interface NFTMetadata {
  tokenId: number;
  owner: string;
  tokenURI: string;
  listing?: Listing;
}

// ============ 타입 정의 ============
export interface Listing {
  tokenId: number;
  seller: string;
  price: string; // ETH 형식
  isValue: boolean;
}

export interface NFTMetadata {
  tokenId: number;
  owner: string;
  tokenURI: string;
  listing?: Listing;
}

// ============ 1. 에어드랍 관련 함수 ============

/**
 * 토큰 에어드랍 요청
 * 사용자당 1회만 가능
 */
export async function requestAirdrop() {
  try {
    const contract = await getDocuTradeContract();
    const signer = await getSigner();
    const address = await signer.getAddress();

    // 이미 받았는지 확인
    const hasReceived = await contract.hasReceivedAirdrop(address);
    if (hasReceived) {
      throw new Error('이미 에어드랍을 받았습니다.');
    }

    const tx = await contract.requestAirdrop();
    console.log('에어드랍 트랜잭션 전송:', tx.hash);
    const receipt = await tx.wait();
    console.log('에어드랍 완료:', receipt);

    return tx.hash;
  } catch (error) {
    console.error('에어드랍 실패:', error);
    throw error;
  }
}

/**
 * 에어드랍 수령 여부 확인
 */
export async function checkAirdropStatus(address: string): Promise<boolean> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    return await contract.hasReceivedAirdrop(address);
  } catch (error) {
    console.error('에어드랍 상태 확인 실패:', error);
    return false;
  }
}

/**
 * 에어드랍 금액 조회
 */
export async function getAirdropAmount(): Promise<string> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    const amount = await contract.airdropAmount();
    return ethers.formatEther(amount);
  } catch (error) {
    console.error('에어드랍 금액 조회 실패:', error);
    return '0';
  }
}

/**
 * 결제 토큰 주소 조회
 */
export async function getPaymentTokenAddress(): Promise<string> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    return await contract.paymentToken();
  } catch (error) {
    console.error('토큰 주소 조회 실패:', error);
    return '';
  }
}

// ============ 2. NFT 발행 (민팅) 함수 ============

/**
 * 새 NFT 발행
 * @param tokenURI - 메타데이터 URI (IPFS, HTTP 등)
 * @returns 발행된 토큰 ID
 */
export async function mintNewNFT(tokenURI: string): Promise<number> {
  try {
    const contract = await getDocuTradeContract();
    const tx = await contract.mintNewNFT(tokenURI);
    
    console.log('NFT 발행 트랜잭션:', tx.hash);
    const receipt = await tx.wait();
    console.log('NFT 발행 완료:', receipt);

    // 이벤트에서 tokenId 추출
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'NFTMinted';
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = contract.interface.parseLog(event);
      return Number(parsed?.args.tokenId);
    }

    throw new Error('토큰 ID를 찾을 수 없습니다.');
  } catch (error) {
    console.error('NFT 발행 실패:', error);
    throw error;
  }
}

// ============ 3. 마켓플레이스 함수 ============

/**
 * NFT를 마켓에 등록 (판매 시작)
 * @param tokenId - NFT 토큰 ID
 * @param price - 판매 가격 (ERC-20 토큰 단위, ETH 형식 문자열)
 */
export async function listNFT(tokenId: number, price: string) {
  try {
    const contract = await getDocuTradeContract();
    const priceInWei = ethers.parseEther(price);

    // 먼저 컨트랙트에 NFT 제어 권한 부여
    const approveTx = await contract.setApprovalForAll(CONTRACT_ADDRESS, true);
    console.log('권한 부여 트랜잭션:', approveTx.hash);
    await approveTx.wait();

    // 판매 등록
    const tx = await contract.listNFT(tokenId, priceInWei);
    console.log('판매 등록 트랜잭션:', tx.hash);
    const receipt = await tx.wait();
    console.log('판매 등록 완료:', receipt);

    return tx.hash;
  } catch (error) {
    console.error('판매 등록 실패:', error);
    throw error;
  }
}

/**
 * NFT 구매
 * @param tokenId - 구매할 NFT 토큰 ID
 * 
 * 주의: 구매 전 반드시 ERC-20 토큰 approve 필요!
 * 프론트엔드에서 먼저 paymentToken.approve(contractAddress, price) 호출
 */
export async function buyNFT(tokenId: number) {
  try {
    const contract = await getDocuTradeContract();
    
    // 판매 정보 확인
    const listing = await contract.listings(tokenId);
    if (!listing.isValue) {
      throw new Error('판매 중이 아닌 NFT입니다.');
    }

    const tx = await contract.buyNFT(tokenId);
    console.log('구매 트랜잭션:', tx.hash);
    const receipt = await tx.wait();
    console.log('구매 완료:', receipt);

    return tx.hash;
  } catch (error) {
    console.error('NFT 구매 실패:', error);
    throw error;
  }
}

/**
 * 특정 NFT의 판매 정보 조회
 */
export async function getListing(tokenId: number): Promise<Listing | null> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    const listing = await contract.listings(tokenId);
    
    if (!listing.isValue) {
      return null;
    }

    return {
      tokenId: Number(listing.tokenId),
      seller: listing.seller,
      price: ethers.formatEther(listing.price),
      isValue: listing.isValue,
    };
  } catch (error) {
    console.error('판매 정보 조회 실패:', error);
    return null;
  }
}

// ============ 4. NFT 조회 함수 ============

/**
 * 사용자가 소유한 모든 NFT 토큰 ID 조회
 * ERC721 balanceOf + 순회로 구현
 */
export async function getUserNFTs(userAddress: string): Promise<number[]> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    const balance = await contract.balanceOf(userAddress);
    const tokenIds: number[] = [];

    // 간단한 방법: 1부터 순회하며 소유자 확인 (가스비 없음, 읽기만)
    // 실제 프로덕션에서는 이벤트 로그를 파싱하는 것이 더 효율적
    for (let i = 1; i <= 100; i++) { // 최대 100개까지 확인
      try {
        const owner = await contract.ownerOf(i);
        if (owner.toLowerCase() === userAddress.toLowerCase()) {
          tokenIds.push(i);
        }
      } catch {
        // 토큰이 존재하지 않거나 burn됨
        continue;
      }
    }

    return tokenIds;
  } catch (error) {
    console.error('NFT 조회 실패:', error);
    return [];
  }
}

/**
 * 특정 NFT의 소유자 조회
 */
export async function getNFTOwner(tokenId: number): Promise<string | null> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    return await contract.ownerOf(tokenId);
  } catch (error) {
    console.error('NFT 소유자 조회 실패:', error);
    return null;
  }
}

/**
 * NFT 메타데이터 URI 조회
 */
export async function getTokenURI(tokenId: number): Promise<string> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    return await contract.tokenURI(tokenId);
  } catch (error) {
    console.error('TokenURI 조회 실패:', error);
    return '';
  }
}

/**
 * NFT 전체 정보 조회 (소유자 + URI + 판매 정보)
 */
export async function getNFTMetadata(tokenId: number): Promise<NFTMetadata | null> {
  try {
    const contract = await getDocuTradeContractReadOnly();
    
    const owner = await contract.ownerOf(tokenId);
    const tokenURI = await contract.tokenURI(tokenId);
    const listingData = await contract.listings(tokenId);

    const listing = listingData.isValue ? {
      tokenId: Number(listingData.tokenId),
      seller: listingData.seller,
      price: ethers.formatEther(listingData.price),
      isValue: listingData.isValue,
    } : undefined;

    return {
      tokenId,
      owner,
      tokenURI,
      listing,
    };
  } catch (error) {
    console.error('NFT 메타데이터 조회 실패:', error);
    return null;
  }
}

// ============ 5. 컨트랙트 정보 조회 ============

/**
 * 컨트랙트 기본 정보 조회
 */
export async function getContractInfo() {
  try {
    const contract = await getDocuTradeContractReadOnly();
    const name = await contract.name();
    const symbol = await contract.symbol();
    const paymentToken = await contract.paymentToken();
    const airdropAmount = await contract.airdropAmount();
    
    return {
      name,
      symbol,
      address: CONTRACT_ADDRESS || '',
      paymentToken,
      airdropAmount: ethers.formatEther(airdropAmount),
    };
  } catch (error) {
    console.error('컨트랙트 정보 조회 실패:', error);
    throw error;
  }
}

// ============ 하위 호환성 유지 (기존 함수들) ============
// 기존 코드와의 호환성을 위해 일부 함수는 deprecated로 유지

/**
 * @deprecated 새 컨트랙트에서는 mintNewNFT 사용
 */
export async function registerDocument(
  title: string,
  fileUrl: string,
  description: string,
  price: string,
  amount: number
) {
  console.warn('⚠️  registerDocument는 deprecated됩니다. mintNewNFT를 사용하세요.');
  // 메타데이터를 JSON으로 만들어 tokenURI로 전달
  const metadata = JSON.stringify({ title, fileUrl, description, price, amount });
  return mintNewNFT(metadata);
}

/**
 * @deprecated 새 컨트랙트에서는 buyNFT 사용
 */
export async function buyDocuments(docId: number, quantity: number, pricePerToken: string) {
  console.warn('⚠️  buyDocuments는 deprecated됩니다. buyNFT를 사용하세요.');
  return buyNFT(docId);
}

/**
 * @deprecated 새 컨트랙트에서는 getNFTMetadata 사용
 */
export async function getDocumentByToken(tokenId: number) {
  console.warn('⚠️  getDocumentByToken은 deprecated됩니다. getNFTMetadata를 사용하세요.');
  const metadata = await getNFTMetadata(tokenId);
  if (!metadata) return null;
  
  // 기존 형식으로 변환
  try {
    const parsedURI = JSON.parse(metadata.tokenURI);
    return {
      docId: tokenId,
      title: parsedURI.title || '',
      fileUrl: parsedURI.fileUrl || '',
      description: parsedURI.description || '',
      seller: metadata.owner,
      pricePerToken: metadata.listing?.price || '0',
      amount: 1,
      isActive: !!metadata.listing,
    };
  } catch {
    return null;
  }
}

/**
 * @deprecated 새 컁랙트에서는 getNFTOwner 사용
 */
export async function ownsDocument(userAddress: string, docId: number): Promise<boolean> {
  const owner = await getNFTOwner(docId);
  return owner?.toLowerCase() === userAddress.toLowerCase();
}

/**
 * @deprecated 새 컨트랙트에는 해당 기능 없음
 */
export async function getUserDocuments(userAddress: string): Promise<number[]> {
  console.warn('⚠️  getUserDocuments는 getUserNFTs로 대체됩니다.');
  return getUserNFTs(userAddress);
}

/**
 * @deprecated 새 컨트랙트에는 해당 기능 없음
 */
export async function getDocument(docId: number) {
  return getDocumentByToken(docId);
}

/**
 * @deprecated 새 컨트랙트에는 totalDocuments 개념 없음
 */
export async function getTotalDocuments(): Promise<number> {
  console.warn('⚠️  새 컨트랙트에는 totalDocuments가 없습니다.');
  return 0;
}