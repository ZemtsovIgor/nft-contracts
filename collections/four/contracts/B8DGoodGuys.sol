// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
pragma abicoder v2;

import 'erc721a/contracts/ERC721A.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import '../lib/IB8DGoodGuys.sol';
import '../lib/IB8DToken.sol';

contract B8DGoodGuys is IB8DGoodGuys, ERC721A, Ownable, ReentrancyGuard {
    using Strings for uint256;
    using SafeERC20 for IERC20;

    IB8DToken public b8dToken;

    uint256 public DEFAULT_COST = 500 * 10**uint(18);
    uint256 public DEFAULT_MAX_SUPPLY = 10000;

    string public uriPrefix = 'ipfs://QmaFQ1MT9FgSJNh5BVaKGwhYHRWvGLmAWT5mNLToLSmLkQ/';
    string public uriSuffix = '.json';

    uint256 public b8dCost;
    uint256 public maxSupply;

    bool public paused = true;

    // Used for generating the tokenId of new NFT minted
    uint private _tokenIds = 1;

    // Map the nftId for each tokenId
    mapping(uint256 => string) private nftIds;

    // Modifier for max NFT count
    modifier mintCompliance(uint256 _mintAmount) {
        require(totalSupply() + _mintAmount <= maxSupply, 'Max supply exceeded!');
        _;
    }

    // Modifier for the NFT price
    modifier mintPriceCompliance(uint256 _mintAmount, address sender) {
        uint256 balance = b8dToken.balanceOf(sender);

        require(balance >= b8dCost * _mintAmount, 'Insufficient funds!');
        _;
    }

    /**
     * @notice Constructor
     * @param _tokenName: name of the token
     * @param _tokenSymbol: symbol of the token
     */
    constructor(
        IB8DToken _b8dToken,
        string memory _tokenName,
        string memory _tokenSymbol
    ) ERC721A(_tokenName, _tokenSymbol) {
        b8dToken = _b8dToken;
        b8dCost = DEFAULT_COST;
        maxSupply = DEFAULT_MAX_SUPPLY;
    }

    /**
     * @notice Mint NFT
     * @param _nftId: NFT image ID
     */
    function mintNFT(
        string memory _nftId
    ) external payable mintCompliance(1) mintPriceCompliance(1, _msgSender()) {
        require(!paused, 'The contract is paused!');

        // Send B8D tokens to this contract
        b8dToken.transferFrom(_msgSender(), address(this), b8dCost);
        uint256 newId = _tokenIds;
        _tokenIds = _tokenIds + 1;
        nftIds[newId] = _nftId;

        _safeMint(_msgSender(), 1);
    }

    /**
     * @notice Mint NFT for Address
     * @param _receiver: receiver address
     * @param _nftId: NFT image ID
     * @dev Callable by owner
     */
    function mintForAddress(
        address _receiver,
        string memory _nftId
    ) external mintCompliance(1) onlyOwner {
        uint256 newId = _tokenIds;
        _tokenIds = _tokenIds + 1;
        nftIds[newId] = _nftId;

        _safeMint(_receiver, 1);
    }

    /**
     * @notice Burn NFT
     * @param _tokenId: NFT ID
     */
    function burnNFT(
        uint256 _tokenId
    ) external {
        require(_exists(_tokenId), 'ERC721Metadata: URI query for nonexistent token');

        _burn(_tokenId);
    }

    /**
     * @notice Getting NFT for Wallet
     * @param _owner: wallet Address
     */
    function walletOfOwner(
        address _owner
    ) external view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory ownedTokenIds = new uint256[](ownerTokenCount);
        uint256 currentTokenId = _startTokenId();
        uint256 ownedTokenIndex = 0;
        address latestOwnerAddress;

        while (ownedTokenIndex < ownerTokenCount && currentTokenId <= maxSupply) {
            TokenOwnership memory ownership = _ownerships[currentTokenId];

            if (!ownership.burned && ownership.addr != address(0)) {
                latestOwnerAddress = ownership.addr;
            }

            if (latestOwnerAddress == _owner) {
                ownedTokenIds[ownedTokenIndex] = currentTokenId;

                ownedTokenIndex++;
            }

            currentTokenId++;
        }

        return ownedTokenIds;
    }

    /**
     * @notice Setting start token id
     */
    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    /**
     * @notice Getting token URI
     * @param _tokenId: tokenId of the NFT
     */
    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        require(_exists(_tokenId), 'ERC721Metadata: URI query for nonexistent token');

        string memory currentBaseURI = _baseURI();
        string memory nftId = nftIds[_tokenId];
        return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, nftId, uriSuffix))
        : '';
    }

    /**
     * @notice Setting new NFT cost
     * @param _cost: new cost
     * @dev Callable by owner
     */
    function setCost(
        uint256 _cost
    ) external onlyOwner {
        b8dCost = _cost;
    }

    /**
     * @notice Setting new max supply
     * @param _maxSupply: new max supply
     * @dev Callable by owner
     */
    function setMaxSupply(
        uint256 _maxSupply
    ) external onlyOwner {
        maxSupply = _maxSupply;
    }

    /**
     * @notice Setting new IRI Prefix
     * @param _uriPrefix: new prefix
     * @dev Callable by owner
     */
    function setUriPrefix(
        string memory _uriPrefix
    ) external onlyOwner {
        uriPrefix = _uriPrefix;
    }

    /**
     * @notice Setting new IRI suffix
     * @param _uriSuffix: new suffix
     * @dev Callable by owner
     */
    function setUriSuffix(
        string memory _uriSuffix
    ) external onlyOwner {
        uriSuffix = _uriSuffix;
    }

    /**
     * @notice Setting contract pause
     * @param _state: pause state
     * @dev Callable by owner
     */
    function setPaused(
        bool _state
    ) external onlyOwner {
        paused = _state;
    }

    /**
     * @notice Return base URI
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return uriPrefix;
    }

    /**
     * @notice withdraw
     * @dev Callable by owner
     */
    function withdraw() external onlyOwner nonReentrant {
        (bool os, ) = payable(owner()).call{value: address(this).balance}('');
        require(os);
    }

    /**
     * @notice withdraw B8D
     * @dev Callable by owner
     */
    function withdrawB8D() external onlyOwner {
        uint256 balance = b8dToken.balanceOf(address(this));

        require(balance > 0, "balance should be > 0");

        b8dToken.transfer(owner(), balance);
    }

    /**
     * @notice burn B8D
     * @dev Callable by owner
     */
    function burnB8D() external onlyOwner {
        uint256 balance = b8dToken.balanceOf(address(this));

        require(balance > 0, "balance should be > 0");

        b8dToken.burn(balance);
    }

    /**
     * @dev Set up json extensions for NFTs
     * Assign tokenURI to look for each nftId in the mint function
     * Only the owner can set it.
     */
    function setNFTJsonArray(
        string[] memory _nftIds,
        address[] memory _receivers
    ) external onlyOwner {
        require(_nftIds.length == _receivers.length, "arrays of the same length");
        _tokenIds = _tokenIds + _nftIds.length;

        for (uint8 i; i < _nftIds.length; i++) {
            uint256 newId = _tokenIds;
            _tokenIds = _tokenIds + 1;
            nftIds[newId] = _nftIds[i];

            _safeMint(_receivers[i], 1);
        }
    }
}
