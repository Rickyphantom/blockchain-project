# DocuTrade 컨트랙트 배포 가이드 (Sepolia)

## 준비물
1. MetaMask 지갑
2. Sepolia 테스트넷 ETH (Faucet에서 받기)
3. ERC-20 토큰 컨트랙트 주소 (결제용)

## 1단계: ERC-20 토큰 배포 (먼저 필요)

### Remix IDE로 이동
https://remix.ethereum.org

### SimpleToken.sol 생성
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleToken is ERC20 {
    constructor() ERC20("DocuToken", "DOCU") {
        _mint(msg.sender, 1000000 * 10**18); // 100만 개
    }
}
```

### 컴파일 및 배포
1. Solidity Compiler 탭에서 `0.8.20` 선택 후 Compile
2. Deploy & Run Transactions 탭
3. Environment: `Injected Provider - MetaMask` 선택
4. MetaMask에서 **Sepolia 네트워크** 확인
5. `Deploy` 클릭
6. 배포 후 **토큰 컨트랙트 주소 복사** (예: 0x1234...)

---

## 2단계: DocuTrade NFT 컨트랙트 배포

### DocuTrade.sol 파일 사용
프로젝트의 `src/contracts/DocuTrade.sol` 파일 내용을 Remix에 복사

### 컴파일
- Solidity Compiler 탭에서 `0.8.20` 선택
- `Compile DocuTrade.sol` 클릭

### 배포
1. Deploy & Run Transactions 탭
2. Contract 선택: `DocuTrade`
3. Constructor 파라미터에 **1단계에서 받은 토큰 주소** 입력
   - 예: `0x1234...` (따옴표 없이)
4. `Deploy` 클릭
5. MetaMask에서 트랜잭션 승인
6. 배포 후 **DocuTrade 컨트랙트 주소 복사**

---

## 3단계: .env.local 파일 업데이트

```env
NEXT_PUBLIC_SUPABASE_URL=https://wscoyvpkpxavosaqhnte.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_CONTRACT_ADDRESS=0x여기에_DocuTrade_주소_입력
```

---

## 4단계: 컨트랙트에 토큰 충전 (에어드랍용)

### Remix에서
1. Deployed Contracts에서 `SimpleToken` 찾기
2. `transfer` 함수 클릭
3. Parameters:
   - `to`: DocuTrade 컨트랙트 주소
   - `amount`: `100000000000000000000000` (10만 토큰, 18 decimals)
4. `transact` 클릭

---

## 5단계: 테스트

1. 웹사이트 새로고침
2. MetaMask 연결 (Sepolia 네트워크)
3. 에어드랍 페이지에서 정보 확인
4. 에어드랍 받기 테스트

---

## Sepolia Faucet (테스트 ETH 받기)
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia

---

## 확인 방법
배포 후 Sepolia Etherscan에서 확인:
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

"Contract" 탭이 보이고 코드가 있어야 정상입니다.
