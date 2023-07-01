// SPDX-License-Identifier: MIT

pragma solidity ^0.6.2;

import '@openzeppelin/contracts/math/SafeMath.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract B8DEXMainCollectionV1 is ERC721, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    // Map the number of tokens per nftId
    mapping(uint8 => uint256) public nftCount;

    // Map the number of tokens burnt per nftId
    mapping(uint8 => uint256) public nftBurnCount;

    // Used for generating the tokenId of new NFT minted
    Counters.Counter private _tokenIds;

    // Map the nftId for each tokenId
    mapping(uint256 => uint8) private nftIds;

    // Map the nftName for a tokenId
    mapping(uint8 => string) private nftNames;

    constructor(
        string memory _baseURI,
        string memory _tokenName,
        string memory _tokenSymbol
    ) public ERC721(_tokenName, _tokenSymbol) {
        _setBaseURI(_baseURI);
    }

    /**
     * @dev Get nftId for a specific tokenId.
     *
     * @param _tokenId: token Id
     */
    function getNftId(uint256 _tokenId) external view returns (uint8) {
        return nftIds[_tokenId];
    }

    /**
     * @dev Get the associated nftName for a specific collectionId.
     *
     * @param _nftId: NFT Id
     */
    function getNftName(uint8 _nftId) external view returns (string memory) {
        return nftNames[_nftId];
    }

    /**
     * @dev Get the associated nftName for a unique tokenId.
     *
     * @param _tokenId: token Id
     */
    function getNFTNameOfTokenId(uint256 _tokenId) external view returns (string memory) {
        uint8 nftId = nftIds[_tokenId];
        return nftNames[nftId];
    }

    /**
     * @dev Mint NFTs. Only the owner can call it.
     *
     * @param _to: receiver address
     * @param _tokenURI: token URI
     * @param _nftId: NFT Id
     */
    function mint(
        address _to,
        string calldata _tokenURI,
        uint8 _nftId
    ) external onlyOwner returns (uint256) {
        uint256 newId = _tokenIds.current();
        _tokenIds.increment();
        nftIds[newId] = _nftId;
        nftCount[_nftId] = nftCount[_nftId].add(1);
        _mint(_to, newId);
        _setTokenURI(newId, _tokenURI);
        return newId;
    }

    /**
     * @dev Set a unique name for each collectionId. It is supposed to be called once.
     *
     * @param _nftId: NFT Id
     * @param _name: NFT name
     */
    function setNFTName(uint8 _nftId, string calldata _name) external onlyOwner {
        nftNames[_nftId] = _name;
    }

    /**
     * @dev Burn a NFT token. Callable by owner only.
     *
     * @param _tokenId: token Id
     */
    function burn(uint256 _tokenId) external onlyOwner {
        uint8 nftIdBurnt = nftIds[_tokenId];
        nftCount[nftIdBurnt] = nftCount[nftIdBurnt].sub(1);
        nftBurnCount[nftIdBurnt] = nftBurnCount[nftIdBurnt].add(1);
        _burn(_tokenId);
    }
}
