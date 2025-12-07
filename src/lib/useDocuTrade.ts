import { ethers } from 'ethers';
import { getSigner } from './web3';
import DocuTradeABI from '@/contracts/DocuTrade.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

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
  return new ethers.Contract(CONTRACT_ADDRESS, DocuTradeABI as any, signer);
}

export async function getDocuTradeContractReadOnly() {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === 'undefined') {
    throw new Error('컨트랙트 주소가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
  }
  
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
): Promise<number> {
  try {
    const contract = await getDocuTradeContract();
    const priceInWei = ethers.parseEther(price);

    console.log('📝 문서 등록 시작...');
    console.log('- 제목:', title);
    console.log('- 가격:', price, 'ETH');
    console.log('- 수량:', amount);

    const tx = await contract.registerDocument(
      title,
      fileUrl,
      description,
      priceInWei,
      amount
    );

    console.log('⏳ 트랜잭션 전송:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ 트랜잭션 완료:', receipt);

    // 이벤트에서 docId 추출
    console.log('🔍 이벤트 로그 확인 중...');
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data
        });
        
        console.log('이벤트 발견:', parsed?.name);
        
        if (parsed?.name === 'DocumentRegistered') {
          const docId = Number(parsed.args[0]);
          console.log('✅ 문서 ID 추출 성공:', docId);
          return docId;
        }
      } catch (e) {
        // 파싱 실패한 로그는 무시
      }
    }

    // 이벤트를 찾지 못한 경우 getTotalDocuments로 최신 ID 가져오기
    console.log('⚠️ 이벤트에서 ID를 찾지 못함. getTotalDocuments 사용...');
    const totalDocs = await contract.getTotalDocuments();
    const docId = Number(totalDocs);
    console.log('✅ 최신 문서 ID:', docId);
    
    return docId;
  } catch (error) {
    console.error('❌ 문서 등록 실패:', error);
    throw error;
  }
}

// 판매 중단 (Supabase만 업데이트)
export async function deactivateDocument(docId: number) {
  try {
    const contract = await getDocuTradeContract();
    
    // 컨트랙트에 있는 함수명 확인
    const fragments = contract.interface.fragments;
    console.log('📋 컨트랙트 함수 목록:', fragments.map((f: any) => f.name));
    
    // 가능한 함수명들
    const possibleFunctions = [
      'deactivateDocument',
      'deactivateSale', 
      'stopSale',
      'pauseSale',
      'cancelDocument',
      'disableDocument'
    ];
    
    let tx;
    let foundFunction = false;
    
    for (const funcName of possibleFunctions) {
      try {
        if (typeof contract[funcName] === 'function') {
          console.log(`✅ 함수 발견: ${funcName}`);
          tx = await contract[funcName](docId);
          foundFunction = true;
          break;
        }
      } catch (e) {
        // 함수가 없으면 다음 시도
        continue;
      }
    }
    
    if (!foundFunction) {
      // 함수가 없으면 Supabase만 업데이트
      console.log('⚠️ 컨트랙트에 판매중단 함수가 없습니다. Supabase만 업데이트합니다.');
      return null;
    }
    
    console.log('판매 중단 트랜잭션:', tx.hash);
    const receipt = await tx.wait();
    console.log('판매 중단 완료:', receipt);
    
    return tx.hash;
  } catch (error) {
    console.error('판매 중단 실패:', error);
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
      address: CONTRACT_ADDRESS || '',
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