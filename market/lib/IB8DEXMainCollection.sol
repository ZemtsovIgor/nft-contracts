// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IB8DEXMainCollection {

    /**
     * @dev Get collectionId for a specific tokenId.
     */
    function getCollectionId(
        uint256 _tokenId
    )
    external
    view
    returns (uint8);

    /**
     * @dev Get the associated collectionName for a specific collectionId.
     */
    function getCollectionName(
        uint8 _collectionId
    )
    external
    view
    returns (string memory);

    /**
     * @dev Get the associated collectionName for a unique tokenId.
     */
    function getCollectionNameOfTokenId(
        uint256 _tokenId
    )
    external
    view
    returns (string memory);

    /**
     * @dev Mint NFTs. Only the owner can call it.
     */
    function mint(
        address _to,
        uint8 _collectionId
    )
    external
    returns (string memory);

    /**
     * @dev Set a unique name for each collectionId. It is supposed to be called once.
     */
    function setCollectionName(
        uint8 _collectionId,
        string calldata _name
    )
    external;

    /**
     * @dev Burn a NFT token. Callable by owner only.
     */
    function burn(
        uint256 _tokenId
    )
    external;
}
