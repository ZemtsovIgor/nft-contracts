// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../lib/ICollectionWhitelistChecker.sol";
import "../lib/IB8DEXMainCollection.sol";

contract MainCollectionWhitelistChecker is Ownable, ICollectionWhitelistChecker {
    IB8DEXMainCollection public mainCollection;

    mapping(uint8 => bool) public isCollectionIdRestricted;

    event NewRestriction(uint8[] collectionIds);
    event RemoveRestriction(uint8[] collectionIds);

    /**
     * @notice Constructor
     * @param _mainCollectionAddress: MainCollection contract
     */
    constructor(address _mainCollectionAddress) {
        mainCollection = IB8DEXMainCollection(_mainCollectionAddress);
    }

    /**
     * @notice Restrict tokens with specific collectionIds to be sold
     * @param _collectionIds: collectionIds to restrict for trading on the market
     */
    function addRestrictionForCollection(uint8[] calldata _collectionIds) external onlyOwner {
        for (uint8 i = 0; i < _collectionIds.length; i++) {
            require(!isCollectionIdRestricted[_collectionIds[i]], "Operations: Already restricted");
            isCollectionIdRestricted[_collectionIds[i]] = true;
        }

        emit NewRestriction(_collectionIds);
    }

    /**
     * @notice Remove restrictions tokens with specific collectionIds to be sold
     * @param _collectionIds: collectionIds to restrict for trading on the market
     */
    function removeRestrictionForCollection(uint8[] calldata _collectionIds) external onlyOwner {
        for (uint8 i = 0; i < _collectionIds.length; i++) {
            require(isCollectionIdRestricted[_collectionIds[i]], "Operations: Not restricted");
            isCollectionIdRestricted[_collectionIds[i]] = false;
        }

        emit RemoveRestriction(_collectionIds);
    }

    /**
     * @notice Check whether token can be listed
     * @param _tokenId: tokenId of the NFT to list
     */
    function canList(uint256 _tokenId) external view override returns (bool) {
        uint8 collectionId = mainCollection.getCollectionId(_tokenId);

        return !isCollectionIdRestricted[collectionId];
    }
}
