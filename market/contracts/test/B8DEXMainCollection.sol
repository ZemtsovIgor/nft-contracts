// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/** @title B8DEXMainCollection.
 * @notice It is the contracts for B8DEX NFTs.
 */
contract B8DEXMainCollection is ERC721, Ownable {
    using Counters for Counters.Counter;

    // Map the number of tokens per collectionId
    mapping(uint8 => uint256) public collectionCount;

    // Map the number of tokens burnt per collectionId
    mapping(uint8 => uint256) public collectionBurnCount;

    // Used for generating the tokenId of new NFT minted
    Counters.Counter private _tokenIds;

    // Map the collectionId for each tokenId
    mapping(uint256 => uint8) private collectionIds;

    // Map the collectionName for a tokenId
    mapping(uint8 => string) private collectionNames;

    constructor() ERC721("Pancake Bunnies", "PB") {
        //
    }

    /**
     * @dev Get collectionId for a specific tokenId.
     */
    function getCollectionId(uint256 _tokenId) external view returns (uint8) {
        return collectionIds[_tokenId];
    }

    /**
     * @dev Get the associated collectionName for a specific collectionId.
     */
    function getCollectionName(uint8 _collectionId) external view returns (string memory) {
        return collectionNames[_collectionId];
    }

    /**
     * @dev Get the associated collectionName for a unique tokenId.
     */
    function getCollectionNameOfTokenId(uint256 _tokenId) external view returns (string memory) {
        uint8 collectionId = collectionIds[_tokenId];
        return collectionNames[collectionId];
    }

    /**
     * @dev Mint NFTs. Only the owner can call it.
     */
    function mint(
        address _to,
        string calldata _tokenURI,
        uint8 _collectionId
    ) external onlyOwner returns (uint256) {
        uint256 newId = _tokenIds.current();
        _tokenIds.increment();
        collectionIds[newId] = _collectionId;
        collectionCount[_collectionId]++;
        _mint(_to, newId);
        return newId;
    }

    /**
     * @dev Set a unique name for each collectionId. It is supposed to be called once.
     */
    function setCollectionName(uint8 _collectionId, string calldata _name) external onlyOwner {
        collectionNames[_collectionId] = _name;
    }

    /**
     * @dev Burn a NFT token. Callable by owner only.
     */
    function burn(uint256 _tokenId) external onlyOwner {
        uint8 collectionIdBurnt = collectionIds[_tokenId];
        collectionCount[collectionIdBurnt]--;
        collectionBurnCount[collectionIdBurnt]++;
        _burn(_tokenId);
    }
}
