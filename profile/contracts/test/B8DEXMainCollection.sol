// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/** @title B8DEXMainCollection.
 * @notice It is the contracts for B8DEX NFTs.
 */
contract B8DEXMainCollection is ERC721, Ownable {
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

    // mapping for token URIs
    mapping (uint256 => string) private _tokenURIs;

    // Base URI
    string private currentBaseURI;

    // Total Supply
    uint256 private _totalSupply = 0;

    constructor(
        string memory _baseURI,
        string memory _tokenName,
        string memory _tokenSymbol
    ) public ERC721(_tokenName, _tokenSymbol) {
        _setCurrentBaseURI(_baseURI);
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
    ) external returns (uint256) {
        uint256 newId = _tokenIds.current();
        _tokenIds.increment();
        nftIds[newId] = _nftId;
        nftCount[_nftId] = nftCount[_nftId] + 1;
        _mint(_to, newId);
        _tokenURIs[newId] = _tokenURI;
        _totalSupply = _totalSupply + 1;
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
        nftCount[nftIdBurnt] = nftCount[nftIdBurnt] - 1;
        nftBurnCount[nftIdBurnt] = nftBurnCount[nftIdBurnt] + 1;
        _burn(_tokenId);
        _totalSupply = _totalSupply - 1;
        delete _tokenURIs[_tokenId];
    }

    /**
     * @dev return total supply NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Internal function to set the base URI for all token IDs. It is
     * automatically added as a prefix to the value returned in {tokenURI},
     * or to the token ID if {tokenURI} is empty.
     *
     * @param baseURI_: base URI
     */
    function _setCurrentBaseURI(string memory baseURI_) internal virtual {
        currentBaseURI = baseURI_;
    }

    /**
     * @dev return NFT URI
     *
     * @param _tokenId: token Id
     */
    function tokenURI(
        uint256 _tokenId
    )
    public
    view
    override
    returns (string memory) {
        require(_exists(_tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory _tokenURI = _tokenURIs[_tokenId];

        // If there is no base URI, return the token URI.
        if (bytes(currentBaseURI).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(currentBaseURI, _tokenURI));
        }
        // If there is a baseURI but no tokenURI, concatenate the tokenID to the baseURI.
        return string(abi.encodePacked(currentBaseURI, Strings.toString(_tokenId)));
    }
}
