# DocuTrade - 새 버전 사용 가이드

## 🚀 주요 변경사항

기존 ETH 기반 결제 시스템에서 **ERC-20 토큰 기반 결제**로 전환되었습니다.

### 새로운 기능
- 🎁 **토큰 에어드랍**: 무료로 결제 토큰 받기 (1인당 1회)
- 🖼️ **NFT 기반**: 각 문서가 고유한 NFT로 발행
- 💰 **ERC-20 결제**: 지정된 토큰으로만 NFT 구매 가능
- 🛒 **마켓플레이스**: NFT 판매 등록 및 거래

---

## 📋 컨트랙트 정보

- **컨트랙트 주소**: `0xd9145CCE52D386f254917e481eB44e9943F39138`
- **네트워크**: Sepolia Testnet
- **NFT 이름**: DocuTrade NFT (DOCNFT)

---

## 🔧 설정 방법

### 1. 환경 변수 설정

`.env.local` 파일:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xd9145CCE52D386f254917e481eB44e9943F39138
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 2. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

http://localhost:3000 접속

---

## 📖 사용 흐름

### 1단계: 에어드랍 받기 (필수)

1. **지갑 연결**: MetaMask 연결 및 Sepolia 네트워크 전환
2. **에어드랍 페이지 이동**: 상단 네비게이션 → 🎁 에어드랍
3. **토큰 받기**: "에어드랍 받기" 버튼 클릭
4. **확인**: 지갑에 토큰이 입금됩니다 (1회만 가능)

### 2단계: NFT 발행 (문서 등록)

1. **등록 페이지 이동**: 📤 등록 메뉴
2. **파일 업로드**: PDF 파일 선택 (최대 50MB)
3. **정보 입력**:
   - 제목
   - 설명
   - 가격 (토큰 단위)
4. **발행**: "NFT 발행" 버튼 클릭
   - 파일이 Supabase에 업로드됩니다
   - 블록체인에 NFT가 발행됩니다
   - DB에 메타데이터가 저장됩니다

### 3단계: NFT 판매 등록

1. **대시보드 이동**: 📊 대시보드
2. **보유 NFT 확인**: 내가 소유한 NFT 목록
3. **판매 등록**: "마켓에 등록" 버튼
   - 가격 설정 (토큰 단위)
   - 자동으로 컨트랙트에 권한 부여
   - 판매 활성화

### 4단계: NFT 구매

1. **마켓 이동**: 🛒 마켓
2. **NFT 선택**: 구매하고 싶은 NFT 선택
3. **토큰 승인**: 
   - 먼저 컨트랙트에 토큰 사용 권한 부여 (Approve)
   - 이 단계는 자동으로 처리됩니다
4. **구매**: "구매" 버튼 클릭
   - 토큰이 판매자에게 전송됩니다
   - NFT가 구매자에게 전송됩니다

---

## 🔑 주요 함수 설명

### 에어드랍 관련

```typescript
// 에어드랍 요청
const txHash = await requestAirdrop();

// 에어드랍 수령 여부 확인
const hasReceived = await checkAirdropStatus(address);

// 에어드랍 금액 조회
const amount = await getAirdropAmount();
```

### NFT 발행 및 거래

```typescript
// NFT 발행
const tokenId = await mintNewNFT(tokenURI);

// 판매 등록
await listNFT(tokenId, price);

// NFT 구매 (토큰 approve 필요!)
await buyNFT(tokenId);

// 판매 정보 조회
const listing = await getListing(tokenId);
```

### ERC-20 토큰

```typescript
// 토큰 잔액 조회
const balance = await getTokenBalance(tokenAddress, userAddress);

// 토큰 승인 (구매 전 필수)
await approveToken(tokenAddress, contractAddress, amount);

// 무제한 승인
await approveTokenMax(tokenAddress, contractAddress);
```

---

## ⚠️ 주의사항

### 1. ERC-20 토큰 필수
- 기존과 달리 **ETH가 아닌 ERC-20 토큰**으로만 결제
- 먼저 에어드랍으로 토큰을 받아야 합니다

### 2. Approve 필수
- NFT 구매 전 반드시 토큰 approve 필요
- 프론트엔드에서 자동 처리되지만, 별도 트랜잭션 발생
- 가스비 2회 소요 (approve + buyNFT)

### 3. NFT 구조 변경
- 기존: docId 기반, 수량 개념 (1개 문서 = 여러 NFT)
- 신규: tokenId 기반, 1:1 매칭 (1개 NFT = 고유 문서)

### 4. 판매 재등록
- NFT를 판매하려면 반드시 `listNFT()` 호출
- 구매 후 자동으로 판매 해제됨

---

## 🛠️ 파일 구조

```
src/
├── contracts/
│   ├── DocuTrade.sol        # 새 Solidity 컨트랙트
│   └── DocuTrade.json        # ABI (컴파일 후 업데이트 필요)
├── lib/
│   ├── useDocuTrade.ts       # 컨트랙트 래퍼 (완전 재작성)
│   ├── erc20.ts              # ERC-20 토큰 헬퍼 (신규)
│   ├── web3.ts               # 지갑 연결
│   └── supabase.ts           # DB/스토리지
└── app/
    ├── airdrop/page.tsx      # 에어드랍 페이지 (신규)
    ├── market/page.tsx       # 마켓플레이스
    ├── upload/page.tsx       # NFT 발행
    └── dashboard/page.tsx    # 대시보드
```

---

## 🔗 참고 링크

- **Sepolia Testnet Faucet**: https://sepolia-faucet.pk910.de
- **MetaMask 다운로드**: https://metamask.io
- **Remix IDE** (컨트랙트 배포용): https://remix.ethereum.org
- **OpenZeppelin Docs**: https://docs.openzeppelin.com

---

## 🐛 트러블슈팅

### "Already received airdrop" 에러
- 이미 에어드랍을 받은 주소입니다
- 다른 MetaMask 계정으로 시도하세요

### "Insufficient token balance" 에러
- 토큰 잔액이 부족합니다
- 에어드랍을 받거나 다른 사용자로부터 토큰을 전송받으세요

### "Not approved for marketplace" 에러
- NFT를 판매하려면 컨트랙트에 권한 부여 필요
- `setApprovalForAll(contractAddress, true)` 자동 호출됨

### "Token payment failed" 에러
- 토큰 approve가 되지 않았거나 잔액 부족
- 먼저 `approveToken()` 호출 필요

---

## 📞 문의

프로젝트 관련 문의사항은 GitHub Issues에 등록해주세요.
