// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IB8DEXNFTMarket {

    enum CollectionStatus {
        Pending,
        Open,
        Close
    }

    struct Ask {
        address seller; // address of the seller
        uint256 price; // price of the token
    }

    struct Collection {
        CollectionStatus status; // status of the collection
        address creatorAddress; // address of the creator
        address whitelistChecker; // whitelist checker (if not set --> 0x00)
        uint256 tradingFee; // trading fee (100 = 1%, 500 = 5%, 5 = 0.05%)
        uint256 creatorFee; // creator fee (100 = 1%, 500 = 5%, 5 = 0.05%)
    }

    /**
     * @notice Buy token with BNB by matching the price of an existing ask order
     * @param _collection: contract address of the NFT
     * @param _tokenId: tokenId of the NFT purchased
     */
    function buyTokenUsingBNB(
        address _collection,
        uint256 _tokenId
    )
    external
    payable;

    /**
     * @notice Buy token with WBNB by matching the price of an existing ask order
     * @param _collection: contract address of the NFT
     * @param _tokenId: tokenId of the NFT purchased
     * @param _price: price (must be equal to the askPrice set by the seller)
     */
    function buyTokenUsingWBNB(
        address _collection,
        uint256 _tokenId,
        uint256 _price
    ) external;

    /**
     * @notice Cancel existing ask order
     * @param _collection: contract address of the NFT
     * @param _tokenId: tokenId of the NFT
     */
    function cancelAskOrder(
        address _collection,
        uint256 _tokenId
    ) external;

    /**
     * @notice Claim pending revenue (treasury or creators)
     */
    function claimPendingRevenue() external;

    /**
     * @notice Create ask order
     * @param _collection: contract address of the NFT
     * @param _tokenId: tokenId of the NFT
     * @param _askPrice: price for listing (in wei)
     */
    function createAskOrder(
        address _collection,
        uint256 _tokenId,
        uint256 _askPrice
    ) external;

    /**
     * @notice Modify existing ask order
     * @param _collection: contract address of the NFT
     * @param _tokenId: tokenId of the NFT
     * @param _newPrice: new price for listing (in wei)
     */
    function modifyAskOrder(
        address _collection,
        uint256 _tokenId,
        uint256 _newPrice
    ) external;

    /**
     * @notice Add a new collection
     * @param _collection: collection address
     * @param _creator: creator address (must be 0x00 if none)
     * @param _whitelistChecker: whitelist checker (for additional restrictions, must be 0x00 if none)
     * @param _tradingFee: trading fee (100 = 1%, 500 = 5%, 5 = 0.05%)
     * @param _creatorFee: creator fee (100 = 1%, 500 = 5%, 5 = 0.05%, 0 if creator is 0x00)
     * @dev Callable by admin
     */
    function addCollection(
        address _collection,
        address _creator,
        address _whitelistChecker,
        uint256 _tradingFee,
        uint256 _creatorFee
    ) external;

    /**
     * @notice Allows the admin to close collection for trading and new listing
     * @param _collection: collection address
     * @dev Callable by admin
     */
    function closeCollectionForTradingAndListing(
        address _collection
    ) external;

    /**
     * @notice Modify collection characteristics
     * @param _collection: collection address
     * @param _creator: creator address (must be 0x00 if none)
     * @param _whitelistChecker: whitelist checker (for additional restrictions, must be 0x00 if none)
     * @param _tradingFee: trading fee (100 = 1%, 500 = 5%, 5 = 0.05%)
     * @param _creatorFee: creator fee (100 = 1%, 500 = 5%, 5 = 0.05%, 0 if creator is 0x00)
     * @dev Callable by admin
     */
    function modifyCollection(
        address _collection,
        address _creator,
        address _whitelistChecker,
        uint256 _tradingFee,
        uint256 _creatorFee
    ) external;

    /**
     * @notice Allows the admin to update minimum and maximum prices for a token (in wei)
     * @param _minimumAskPrice: minimum ask price
     * @param _maximumAskPrice: maximum ask price
     * @dev Callable by admin
     */
    function updateMinimumAndMaximumPrices(
        uint256 _minimumAskPrice,
        uint256 _maximumAskPrice
    ) external;

    /**
     * @notice Allows the owner to recover tokens sent to the contract by mistake
     * @param _token: token address
     * @dev Callable by owner
     */
    function recoverFungibleTokens(
        address _token
    ) external;

    /**
     * @notice Allows the owner to recover NFTs sent to the contract by mistake
     * @param _token: NFT token address
     * @param _tokenId: tokenId
     * @dev Callable by owner
     */
    function recoverNonFungibleToken(
        address _token,
        uint256 _tokenId
    ) external;

    /**
     * @notice Set admin address
     * @dev Only callable by owner
     * @param _adminAddress: address of the admin
     * @param _treasuryAddress: address of the treasury
     */
    function setAdminAndTreasuryAddresses(
        address _adminAddress,
        address _treasuryAddress
    )
    external;

    /**
     * @notice Check asks for an array of tokenIds in a collection
     * @param collection: address of the collection
     * @param tokenIds: array of tokenId
     */
    function viewAsksByCollectionAndTokenIds(
        address collection,
        uint256[] calldata tokenIds
    )
    external
    view
    returns (
        bool[] memory,
        Ask[] memory
    );

    /**
     * @notice View ask orders for a given collection across all sellers
     * @param collection: address of the collection
     * @param cursor: cursor
     * @param size: size of the response
     */
    function viewAsksByCollection(
        address collection,
        uint256 cursor,
        uint256 size
    )
    external
    view
    returns (
        uint256[] memory,
        Ask[] memory,
        uint256
    );

    /**
     * @notice View ask orders for a given collection and a seller
     * @param collection: address of the collection
     * @param seller: address of the seller
     * @param cursor: cursor
     * @param size: size of the response
     */
    function viewAsksByCollectionAndSeller(
        address collection,
        address seller,
        uint256 cursor,
        uint256 size
    )
    external
    view
    returns (
        uint256[] memory,
        Ask[] memory,
        uint256
    );

    /*
     * @notice View addresses and details for all the collections available for trading
     * @param cursor: cursor
     * @param size: size of the response
     */
    function viewCollections(
        uint256 cursor,
        uint256 size
    )
    external
    view
    returns (
        address[] memory,
        Collection[] memory,
        uint256
    );

    /**
     * @notice Calculate price and associated fees for a collection
     * @param collection: address of the collection
     * @param price: listed price
     */
    function calculatePriceAndFeesForCollection(address collection, uint256 price)
    external
    view
    returns (
        uint256,
        uint256,
        uint256
    );
}
