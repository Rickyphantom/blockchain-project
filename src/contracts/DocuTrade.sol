// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DocuTrade is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // 1. 거래에 사용할 ERC-20 토큰 주소
    IERC20 public paymentToken;
    uint256 public airdropAmount = 1000 * 10**18; // 예: 1000개 (소수점 18자리 기준)

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isValue;
    }

    // tokenId => 판매 정보
    mapping(uint256 => Listing) public listings;
    // 사용자별 에어드랍 수령 여부 (중복 방지)
    mapping(address => bool) public hasReceivedAirdrop;

    event NFTMinted(uint256 indexed tokenId, address indexed creator, string uri);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event AirdropSent(address indexed receiver, uint256 amount);

    constructor(address _tokenAddress) ERC721("DocuTrade NFT", "DOCNFT") Ownable(msg.sender) {
        paymentToken = IERC20(_tokenAddress);
    }

    /**
     * 1. 토큰 드랍 기능
     * 컨트랙트가 보유한 ERC-20 토큰을 신청자에게 전송합니다.
     */
    function requestAirdrop() public {
        require(!hasReceivedAirdrop[msg.sender], "Already received airdrop");
        require(paymentToken.balanceOf(address(this)) >= airdropAmount, "Insufficient faucet balance");

        hasReceivedAirdrop[msg.sender] = true;
        bool success = paymentToken.transfer(msg.sender, airdropAmount);
        require(success, "Token transfer failed");

        emit AirdropSent(msg.sender, airdropAmount);
    }

    /**
     * 2. 누구나 새로운 NFT를 등록(발행)하는 기능
     */
    function mintNewNFT(string memory _tokenURI) public returns (uint256) {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);

        emit NFTMinted(newTokenId, msg.sender, _tokenURI);
        return newTokenId;
    }

    /**
     * 3. 마켓플레이스 판매 등록
     * 자신이 소유한 NFT를 지정한 가격(ERC-20 토큰 기준)에 올립니다.
     */
    function listNFT(uint256 _tokenId, uint256 _price) public {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(_price > 0, "Price must be greater than zero");
        // 컨트랙트가 NFT를 제어할 수 있도록 권한 필요 (프론트에서 approve 호출 권장)
        require(isApprovedForAll(msg.sender, address(this)) || getApproved(_tokenId) == address(this), "Not approved for marketplace");

        listings[_tokenId] = Listing({
            tokenId: _tokenId,
            seller: msg.sender,
            price: _price,
            isValue: true
        });

        emit NFTListed(_tokenId, msg.sender, _price);
    }

    /**
     * 3. 마켓플레이스 구매 기능
     * 1번에서 지정한 ERC-20 토큰으로만 결제 가능합니다.
     */
    function buyNFT(uint256 _tokenId) public {
        Listing storage listing = listings[_tokenId];
        require(listing.isValue, "NFT not for sale");
        require(listing.seller != msg.sender, "Cannot buy your own NFT");
        
        uint256 price = listing.price;
        address seller = listing.seller;

        // 구매자의 토큰 잔액 및 허용량 확인
        require(paymentToken.balanceOf(msg.sender) >= price, "Insufficient token balance");
        
        // 판매 정보 삭제 (재진입 공격 방지 위해 선삭제)
        delete listings[_tokenId];

        // 토큰 전송 (구매자 -> 판매자)
        bool success = paymentToken.transferFrom(msg.sender, seller, price);
        require(success, "Token payment failed");

        // NFT 전송 (판매자 -> 구매자)
        _transfer(seller, msg.sender, _tokenId);

        emit NFTSold(_tokenId, msg.sender, seller, price);
    }

    // 컨트랍트의 토큰 잔액 충전 (관리자용)
    function depositTokens(uint256 _amount) public onlyOwner {
        paymentToken.transferFrom(msg.sender, address(this), _amount);
    }

    // 에어드랍 금액 변경 (관리자용)
    function setAirdropAmount(uint256 _newAmount) public onlyOwner {
        airdropAmount = _newAmount;
    }
}
