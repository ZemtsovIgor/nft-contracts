// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "../lib/IB8DEXMainCollection.sol";

contract B8DEXMintingStationV1 is AccessControl {
    IB8DEXMainCollection public b8dMainCollection;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Modifier for minting roles
    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, _msgSender()), "Not a minting role");
        _;
    }

    // Modifier for admin roles
    modifier onlyOwner() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Not an admin role");
        _;
    }

    constructor(IB8DEXMainCollection _b8dMainCollection) public {
        b8dMainCollection = _b8dMainCollection;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @notice Mint NFTs from the B8DEXMainCollection contract.
     * Users can specify what nftId they want to mint. Users can claim once.
     * There is a limit on how many are distributed. It requires B8D balance to be > 0.
     */
    function mintCollectible(
        address _tokenReceiver,
        string calldata _tokenURI,
        uint8 _nftId
    ) external onlyMinter returns (uint256) {
        uint256 tokenId = b8dMainCollection.mint(_tokenReceiver, _tokenURI, _nftId);
        return tokenId;
    }

    /**
     * @notice Set up names for NFTs.
     * @dev Only the main admins can set it.
     */
    function setNFTName(uint8 _nftId, string calldata _nftName) external onlyOwner {
        b8dMainCollection.setNFTName(_nftId, _nftName);
    }

    /**
     * @dev It transfers the ownership of the NFT contract to a new address.
     * @dev Only the main admins can set it.
     */
    function changeOwnershipNFTContract(address _newOwner) external onlyOwner {
        b8dMainCollection.transferOwnership(_newOwner);
    }
}
