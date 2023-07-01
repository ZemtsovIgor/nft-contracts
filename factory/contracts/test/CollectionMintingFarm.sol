// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./B8DEXMainCollection.sol";

contract CollectionMintingFarm is Ownable {
    using SafeMath for uint8;
    using SafeMath for uint256;

    using SafeERC20 for IERC20;

    B8DEXMainCollection public b8dMainCollection;
    IERC20 public b8dToken;

    // Map if address can claim a NFT
    mapping(address => bool) public canClaim;

    // Map if address has already claimed a NFT
    mapping(address => bool) public hasClaimed;

    // starting block
    uint256 public startBlockNumber;

    // end block number to claim B8Ds by burning NFT
    uint256 public endBlockNumber;

    // number of total NFT burnt
    uint256 public countNFTBurnt;

    // Number of B8Ds a user can collect by burning her NFT
    uint256 public b8dPerBurn;

    // current distributed number of NFTs
    uint256 public currentDistributedSupply;

    // number of total NFTs distributed
    uint256 public totalSupplyDistributed;

    // baseURI (on IPFS)
    string private baseURI;

    // Map the token number to URI
    mapping(uint8 => string) private nftIdURIs;

    // number of initial series (i.e. different visuals)
    uint8 private numberOfNFTIds;

    // Event to notify when NFT is successfully minted
    event NFTMint(address indexed to, uint256 indexed tokenId, uint8 indexed nftId);

    // Event to notify when NFT is successfully minted
    event NFTBurn(address indexed from, uint256 indexed tokenId);

    /**
     * @dev A maximum number of NFT tokens that is distributed by this contract
     * is defined as totalSupplyDistributed.
     */
    constructor(
        IERC20 _b8dToken,
        uint256 _totalSupplyDistributed,
        uint256 _b8dPerBurn,
        string memory _tokenName,
        string memory _tokenSymbol,
        string memory _baseURI,
        string memory _ipfsHash,
        uint256 _endBlockNumber
    ) public {
        b8dMainCollection = new B8DEXMainCollection(_baseURI, _tokenName, _tokenSymbol);
        b8dToken = _b8dToken;
        totalSupplyDistributed = _totalSupplyDistributed;
        b8dPerBurn = _b8dPerBurn;
        baseURI = _baseURI;
        endBlockNumber = _endBlockNumber;

        // Other parameters initialized
        numberOfNFTIds = 5;

        // Assign tokenURI to look for each nftId in the mint function
        nftIdURIs[0] = string(abi.encodePacked(_ipfsHash, "swapsies.json"));
        nftIdURIs[1] = string(abi.encodePacked(_ipfsHash, "drizzle.json"));
        nftIdURIs[2] = string(abi.encodePacked(_ipfsHash, "blueberries.json"));
        nftIdURIs[3] = string(abi.encodePacked(_ipfsHash, "circular.json"));
        nftIdURIs[4] = string(abi.encodePacked(_ipfsHash, "sparkle.json"));

        // Set token names for each nftId
        b8dMainCollection.setNFTName(0, "Swapsies");
        b8dMainCollection.setNFTName(1, "Drizzle");
        b8dMainCollection.setNFTName(2, "Blueberries");
        b8dMainCollection.setNFTName(3, "Circular");
        b8dMainCollection.setNFTName(4, "Sparkle");
    }

    /**
     * @dev Mint NFTs from the B8DEXMainCollection contract.
     * Users can specify what nftId they want to mint. Users can claim once.
     * There is a limit on how many are distributed. It requires B8D balance to be > 0.
     */
    function mintNFT(uint8 _nftId) external {
        // Check msg.sender can claim
        require(canClaim[msg.sender], "Cannot claim");
        // Check msg.sender has not claimed
        require(hasClaimed[msg.sender] == false, "Has claimed");
        // Check whether it is still possible to mint
        require(currentDistributedSupply < totalSupplyDistributed, "Nothing left");
        // Check whether user owns any CAKE
        require(b8dToken.balanceOf(msg.sender) > 0, "Must own B8D");
        // Check that the _nftId is within boundary:
        require(_nftId < numberOfNFTIds, "nftId unavailable");
        // Update that msg.sender has claimed
        hasClaimed[msg.sender] = true;

        // Update the currentDistributedSupply by 1
        currentDistributedSupply = currentDistributedSupply.add(1);

        string memory tokenURI = nftIdURIs[_nftId];

        uint256 tokenId = b8dMainCollection.mint(address(msg.sender), tokenURI, _nftId);

        emit NFTMint(msg.sender, tokenId, _nftId);
    }

    /**
     * @dev Burn NFT from the B8DEXMainCollection contract.
     * Users can burn their NFT to get a set number of B8D.
     * There is a cap on how many can be distributed for free.
     */
    function burnNFT(uint256 _tokenId) external {
        require(b8dMainCollection.ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(block.number < endBlockNumber, "too late");

        b8dMainCollection.burn(_tokenId);
        countNFTBurnt = countNFTBurnt.add(1);
        b8dToken.safeTransfer(address(msg.sender), b8dPerBurn);
        emit NFTBurn(msg.sender, _tokenId);
    }

    /**
     * @dev Allow to set up the start number
     * Only the owner can set it.
     */
    function setStartBlockNumber() external onlyOwner {
        startBlockNumber = block.number;
    }

    /**
     * @dev Allow the contract owner to whitelist addresses.
     * Only these addresses can claim.
     */
    function whitelistAddresses(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            canClaim[users[i]] = true;
        }
    }

    /**
     * @dev It transfers the B8D tokens back to the chef address.
     * Only callable by the owner.
     */
    function withdrawB8D(uint256 _amount) external onlyOwner {
        require(block.number >= endBlockNumber, "too early");
        b8dToken.safeTransfer(address(msg.sender), _amount);
    }

    /**
     * @dev It transfers the ownership of the NFT contract
     * to a new address.
     */
    function changeOwnershipNFTContract(address _newOwner) external onlyOwner {
        b8dMainCollection.transferOwnership(_newOwner);
    }
}
