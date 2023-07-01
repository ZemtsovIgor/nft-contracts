import { assert } from "chai";
// @ts-ignore
import { expectEvent, expectRevert, time } from "@openzeppelin/test-helpers";
import { artifacts, contract } from "hardhat";

const B8DEXMintFactory = artifacts.require("./B8DEXMintFactoryV1.sol");

const MockERC20 = artifacts.require("./test/MockERC20.sol");
const CollectionMintingFarm = artifacts.require("./test/CollectionMintingFarm.sol");
const B8DEXMainCollection = artifacts.require("./test/B8DEXMainCollection.sol");
const B8DEXMintingStation = artifacts.require("./test/B8DEXMintingStation.sol");

contract(
  "CollectionMintingFarm",
  ([alice, bob, carol, david, erin, frank, minterTester]) => {

    let mockB8D: any;
    let b8dMainCollection: any;
    let b8dMainCollectionAddress: any;
    let collectionMintingFarm: any;
    let collectionMintingFarmAddress: any;
    let collectionMintFactory: any;
    let collectionMintStation: any;
    let result: any;
    let result2: any;
    let MINTER_ROLE: any;
    let ADMIN_ROLE: any;

    before(async () => {
      let _totalSupplyDistributed = 5;
      let _b8dPerBurn = 20;
      let _testBaseURI = "ipfs://ipfs/";
      let _ipfsHash = "IPFSHASH/";
      let _endBlockTime = 150;
      let _tokenName = 'B8DEX Token';
      let _tokenSymbol = 'B8T';
      let _nftCollectionName = 'B8DEX Fish';
      let _nftCollectionSymbol = 'BF';

      mockB8D = await MockERC20.new(_tokenName, _tokenSymbol, 10000, {
        from: minterTester,
      });

      collectionMintingFarm = await CollectionMintingFarm.new(
        mockB8D.address,
        _totalSupplyDistributed,
        _b8dPerBurn,
        _nftCollectionName,
        _nftCollectionSymbol,
        _testBaseURI,
        _ipfsHash,
        _endBlockTime,
        { from: alice }
      );

      collectionMintingFarmAddress = collectionMintingFarm.address;
      b8dMainCollectionAddress = await collectionMintingFarm.b8dMainCollection();
      b8dMainCollection = await B8DEXMainCollection.at(b8dMainCollectionAddress);
    });

  // Check ticker, symbols, supply, and owner are correct
  describe("All contracts are deployed correctly", async () => {
    it("Symbol is correct", async () => {
      result = await b8dMainCollection.symbol();
      assert.equal(result, "BF");
    });
    it("Name is correct", async () => {
      result = await b8dMainCollection.name();
      assert.equal(result, "B8DEX Fish");
    });
    it("Total supply + number of NFT distributed is 0", async () => {
      result = await b8dMainCollection.totalSupply();
      assert.equal(result, 0);
      result = await collectionMintingFarm.totalSupplyDistributed();
      assert.equal(result, 5);
      result = await collectionMintingFarm.currentDistributedSupply();
      assert.equal(result, 0);
    });
    it("Owner is the collectionMintingFarm contract", async () => {
      result = await b8dMainCollection.owner();
      assert.equal(result, collectionMintingFarmAddress);
      result = await collectionMintingFarm.owner();
      assert.equal(result, alice);
    });
    it("MinterTester distributes tokens to accounts", async () => {
      result = await mockB8D.totalSupply();
      assert.equal(result, 10000);
      result = await mockB8D.balanceOf(minterTester);
      assert.equal(result, 10000);
      // transfer CAKE to 5 accounts
      await mockB8D.transfer(alice, 500, { from: minterTester });
      await mockB8D.transfer(bob, 300, { from: minterTester });
      await mockB8D.transfer(carol, 500, { from: minterTester });
      await mockB8D.transfer(david, 500, { from: minterTester });
      await mockB8D.transfer(erin, 400, { from: minterTester });
      result = await mockB8D.balanceOf(minterTester);
      assert.equal(result, 7800);
    });
  });

  // Check ticker and symbols are correct
  describe("Whitelisting works as intended", async () => {
    it("Only contract owner can whitelist", async () => {
      // Only contract owner can whitelist
      await expectRevert(
        collectionMintingFarm.whitelistAddresses([alice, bob, carol, david, erin], { from: bob }),
        "Ownable: caller is not the owner"
      );

      // Whitelist addresses
      await collectionMintingFarm.whitelistAddresses([alice, bob, carol, david, erin], { from: alice });
    });
  });

  describe("Tokens can be claimed", async () => {
    it("Only B8D owner can mint once", async () => {
      result = await collectionMintingFarm.hasClaimed(alice);
      assert.equal(result, false);

      result = await collectionMintingFarm.canClaim(alice);
      assert.equal(result, true);

      result = await collectionMintingFarm.mintNFT("3", { from: alice });

      // Obtain gas used from the receipt
      expectEvent(result, "NFTMint", {
        to: alice,
        tokenId: "0",
        nftId: "3",
      });

      // check totalSupply and CAKE balance of Alice
      result = await b8dMainCollection.totalSupply();
      assert.equal(result, 1);
      result = await b8dMainCollection.balanceOf(alice);
      assert.equal(result, 1);
      result = await b8dMainCollection.ownerOf("0");
      assert.equal(result, alice);
      result = await collectionMintingFarm.currentDistributedSupply();
      assert.equal(result, 1);
      result = await collectionMintingFarm.hasClaimed(alice);
      assert.equal(result, true);

      // Check how many exists for a specific NFTCount
      result = await b8dMainCollection.nftCount("3");
      assert.equal(result, 1);

      // Check token URI is ok
      result = await b8dMainCollection.tokenURI("0");
      assert.equal(result, "ipfs://ipfs/IPFSHASH/circular.json");

      // verify Alice cannot claim twice
      await expectRevert(collectionMintingFarm.mintNFT("2", { from: alice }), "Has claimed");

      // verify someone needs to be whitelisted
      await expectRevert(collectionMintingFarm.mintNFT("2", { from: frank }), "Cannot claim");

      result = await collectionMintingFarm.canClaim(frank);
      assert.equal(result, false);

      // Frank is whitelisted by Alice
      await collectionMintingFarm.whitelistAddresses([frank, minterTester], {
        from: alice,
      });

      result = await collectionMintingFarm.canClaim(frank);
      assert.equal(result, true);

      // verify CAKE is required to mint the NFT
      await expectRevert(collectionMintingFarm.mintNFT("2", { from: frank }), "Must own B8D");
      // Verify that only nftIds strictly inferior to 5 are available (0, 1, 2, 3, 4)
      await expectRevert(collectionMintingFarm.mintNFT("5", { from: bob }), "nftId unavailable");
    });

    it("It is not possible to mint more than expected", async () => {
      // 4 more accounts collect their NFTs
      await collectionMintingFarm.mintNFT("1", { from: bob });
      await collectionMintingFarm.mintNFT("2", { from: carol });
      await collectionMintingFarm.mintNFT("2", { from: david });
      await collectionMintingFarm.mintNFT("0", { from: erin });

      // Alice transfers 10 CAKE to Frank to verify he cannot participate
      await mockB8D.transfer(frank, "10", { from: alice });
      await expectRevert(collectionMintingFarm.mintNFT("2", { from: frank }), "Nothing left");

      // Check that currentDistributedSupply is equal to totalSupplyDistributed
      result = await collectionMintingFarm.totalSupplyDistributed();
      result2 = await collectionMintingFarm.currentDistributedSupply();
      assert.equal(result.toString(), result2.toString());

      // Check how many exists for a specific NFTCount
      result = await b8dMainCollection.nftCount("0");
      assert.equal(result, 1);
      result = await b8dMainCollection.nftCount("1");
      assert.equal(result, 1);
      result = await b8dMainCollection.nftCount("2");
      assert.equal(result, 2);
      result = await b8dMainCollection.nftCount("3");
      assert.equal(result, 1);
      result = await b8dMainCollection.nftCount("4");
      assert.equal(result, 0);
      result = await b8dMainCollection.nftCount("5");
      assert.equal(result, 0);
    });

    it("Names and ids of NFTs are appropriate", async () => {
      result = await b8dMainCollection.getNftName(0);
      assert.equal(result, "Swapsies");
      result = await b8dMainCollection.getNftName(1);
      assert.equal(result, "Drizzle");
      result = await b8dMainCollection.getNftName(2);
      assert.equal(result, "Blueberries");
      result = await b8dMainCollection.getNftName(3);
      assert.equal(result, "Circular");
      result = await b8dMainCollection.getNftName(4);
      assert.equal(result, "Sparkle");

      result = await b8dMainCollection.getNftId(0);
      assert.equal(result, 3);
      result = await b8dMainCollection.getNftId(1);
      assert.equal(result, 1);
      result = await b8dMainCollection.getNftId(2);
      assert.equal(result, 2);
      result = await b8dMainCollection.getNftId(3);
      assert.equal(result, 2);
      result = await b8dMainCollection.getNftId(4);
      assert.equal(result, 0);

      result = await b8dMainCollection.getNFTNameOfTokenId(0);
      assert.equal(result, "Circular");
      result = await b8dMainCollection.getNFTNameOfTokenId(1);
      assert.equal(result, "Drizzle");
      result = await b8dMainCollection.getNFTNameOfTokenId(2);
      assert.equal(result, "Blueberries");
      result = await b8dMainCollection.getNFTNameOfTokenId(3);
      assert.equal(result, "Blueberries");
      result = await b8dMainCollection.getNFTNameOfTokenId(4);
      assert.equal(result, "Swapsies");
    });

    it("Users can only burns tokens they own", async () => {
      // Alice transfers number cakePerBurn * totalSupplyDistributed to the contract
      result = await mockB8D.transfer(collectionMintingFarmAddress, 100, {
        from: alice,
      });
      expectEvent(result, "Transfer", {
        from: alice,
        to: collectionMintingFarmAddress,
        value: "100",
      });

      // Verify that nothing was burnt
      result = await collectionMintingFarm.countNFTBurnt();
      assert.equal(result, "0");

      // Test that it fails without owning the token
      await expectRevert(collectionMintingFarm.burnNFT("1", { from: carol }), "Not the owner");

      result = await collectionMintingFarm.burnNFT("2", { from: carol });

      expectEvent(result, "NFTBurn", {
        from: carol,
        tokenId: "2",
      });

      // Check that one NFT was burnt
      result = await collectionMintingFarm.countNFTBurnt();
      assert.equal(result, "1");

      // Check Carol has no NFT
      result = await b8dMainCollection.balanceOf(carol);
      assert.equal(result, 0);

      // Check CAKE balance of the account decreases
      result = await mockB8D.balanceOf(collectionMintingFarmAddress);
      assert.equal(result, 80);
    });

    it("Alice only can withdraw after the time", async () => {
      // Alice tries to withdraw CAKE tokens before the end
      await expectRevert(collectionMintingFarm.withdrawB8D(80, { from: alice }), "too early");

      // move the current block to the _endBlockTime
      await time.advanceBlockTo(150);

      // Frank tries to steal it
      await expectRevert(collectionMintingFarm.withdrawB8D(80, { from: frank }), "Ownable: caller is not the owner");

      // Bob tries to burn his NFT (tokenId = 2)
      await expectRevert(collectionMintingFarm.burnNFT("1", { from: bob }), "too late");

      // Alice tries to withdraw more
      await expectRevert(
        collectionMintingFarm.withdrawB8D(2000, { from: alice }),
        "ERC20: transfer amount exceeds balance"
      );

      await collectionMintingFarm.withdrawB8D(80, { from: alice });

      result = await mockB8D.balanceOf(alice);

      // Verify CAKE balance of Alice is updated
      assert.equal(result.toString(), "470"); // she gave 10 to Frank - 20 burn

      // Verify CAKE balance of collectionMintingFarm contract is 0
      result = await mockB8D.balanceOf(collectionMintingFarmAddress);
      assert.equal(result, 0);
    });
  });

  describe("NFTFactory", async () => {
    it("NFT contract cannot change owner by a third party", async () => {
      result2 = await b8dMainCollection.owner();

      // Check that only the owner of the collectionMintingFarm can call it
      await expectRevert(
        collectionMintingFarm.changeOwnershipNFTContract(carol, { from: bob }),
        "Ownable: caller is not the owner"
      );
    });

    it("NFT contract owner changes correctly", async () => {
      // Alice, the owner, calls to change the ownership of the B8DEXMainCollection contract to Bob
      result = await collectionMintingFarm.changeOwnershipNFTContract(bob, {
        from: alice,
      });

      expectEvent(result, "OwnershipTransferred", {
        previousOwner: collectionMintingFarmAddress,
        newOwner: bob,
      });

      // Check the new owner
      result = await b8dMainCollection.owner();

      // Verify that the old owner is not the new owner
      assert.notEqual(result, result2);
      // Verify that the new owner is Bob
      assert.equal(result, bob);
    });
  });

  describe("NFTMintingFactory", async () => {

    it("B8DEXMintingStation is deployed", async () => {
      collectionMintStation = await B8DEXMintingStation.new(
        b8dMainCollection.address,
        { from: alice }
      );

      MINTER_ROLE = await collectionMintStation.MINTER_ROLE();
      ADMIN_ROLE = await collectionMintStation.DEFAULT_ADMIN_ROLE();
    });

    it("NFTMintingFactory is deployed", async () => {
      const _ipfsHash = "testIpfsHash/";
      const _tokenPrice = "4000000000000000000";
      const _endBlockNumber = 350;
      const _startBlockNumber = 1;

      collectionMintFactory = await B8DEXMintFactory.new(
        b8dMainCollection.address,
        collectionMintStation.address,
        mockB8D.address,
        _tokenPrice,
        _ipfsHash,
        _startBlockNumber,
        _endBlockNumber,
        { from: alice }
      );


      // Transfer ownership to Alice
      result = await b8dMainCollection.transferOwnership(collectionMintFactory.address, { from: bob });

      expectEvent(result, "OwnershipTransferred", {
        previousOwner: bob,
        newOwner: collectionMintFactory.address,
      });


      // Check the new owner is NFTFactory
      assert.equal(await b8dMainCollection.owner(), collectionMintFactory.address);
      assert.equal(await collectionMintFactory.startBlockNumber(), _startBlockNumber);
      assert.equal(await collectionMintFactory.endBlockNumber(), _endBlockNumber);
      assert.equal(await collectionMintFactory.tokenPrice(), _tokenPrice);
    });

    it("NFTMintingFactory role granted", async () => {
      // Transfer ownership to Alice
      result = await collectionMintStation.grantRole(MINTER_ROLE, collectionMintFactory.address, { from: alice });

      expectEvent(result, "RoleGranted", {
        role: MINTER_ROLE,
        account: collectionMintFactory.address,
        sender: alice,
      });

      // Transfer ownership to Alice
      result = await collectionMintStation.grantRole(ADMIN_ROLE, collectionMintFactory.address, { from: alice });

      expectEvent(result, "RoleGranted", {
        role: ADMIN_ROLE,
        account: collectionMintFactory.address,
        sender: alice,
      });

      // Transfer ownership to Bob
      result = await collectionMintFactory.changeOwnershipNFTContract(collectionMintStation.address, {
        from: alice,
      });

      // Verify events
      expectEvent.inTransaction(result.receipt.transactionHash, b8dMainCollection, "OwnershipTransferred");

      // Check the new owner is NFTFactory
      assert.equal(await b8dMainCollection.owner(), collectionMintStation.address);
    });

    it("NFT Names and json extensions are set", async () => {
      result = await collectionMintFactory.setNumberNFTIds(
        5,
        { from: alice}
      );

      result = await collectionMintFactory.setPreviousNumberNFTIds(
        5,
        { from: alice}
      );

      result = await collectionMintFactory.setNFTNamesArray(
        [5, 6, 7, 8, 9],
        ["MyNFT5", "MyNFT6", "MyNFT7", "MyNFT8", "MyNFT9"],
        { from: alice}
      );

      result = await b8dMainCollection.getNftName("5");
      assert.equal(result, "MyNFT5");

      result = await b8dMainCollection.getNftName("6");
      assert.equal(result, "MyNFT6");

      result = await b8dMainCollection.getNftName("7");
      assert.equal(result, "MyNFT7");

      result = await b8dMainCollection.getNftName("8");
      assert.equal(result, "MyNFT8");

      result = await b8dMainCollection.getNftName("9");
      assert.equal(result, "MyNFT9");

      result = await collectionMintFactory.setNFTJsonArray(
        [5, 6, 7, 8, 9],
        ["test5.json", "test6.json", "test7.json", "test8.json", "test9.json"],
        { from: alice }
      );
    });

    it("Alice can mint", async () => {
      // Alice mints 10 CAKE
      await mockB8D.mintTokens("10000000000000000000", { from: alice });

      // CAKE was not approved
      await expectRevert(collectionMintFactory.mintNFT("6", { from: alice }), "ERC20: insufficient allowance");

      result = await mockB8D.approve(collectionMintFactory.address, "10000000000000000000", { from: alice });

      expectEvent(result, "Approval");

      // Cannot mint old series
      await expectRevert(collectionMintFactory.mintNFT("4", { from: alice }), "nftId too low");

      // Cannot mint series that do not exist
      await expectRevert(collectionMintFactory.mintNFT("10", { from: alice }), "nftId too high");

      assert.equal(await collectionMintFactory.hasClaimed(alice), false);

      result = await collectionMintFactory.mintNFT("6", { from: alice });

      expectEvent(result, "NFTMint", {
        to: alice,
        tokenId: "5",
        nftId: "6",
      });

      result = await b8dMainCollection.totalSupply();
      assert.equal(result.toString(), "5");
      assert.equal(await collectionMintFactory.hasClaimed(alice), true);

      result = await b8dMainCollection.nftCount("6");
      assert.equal(result.toString(), "1");

      result = await b8dMainCollection.getNFTNameOfTokenId("5");
      assert.equal(result, "MyNFT6");

      result = await b8dMainCollection.getNftId("5");
      assert.equal(result, "6");

      result = await mockB8D.balanceOf(collectionMintFactory.address);
      assert.equal(result, "4000000000000000000");
    });
    it("Alice cannot mint twice", async () => {
      await expectRevert(collectionMintFactory.mintNFT("7", { from: alice }), "Has claimed");
    });
    it("Alice cannot mint twice", async () => {
      await expectRevert(collectionMintFactory.mintNFT("7", { from: alice }), "Has claimed");
    });
    it("Bob cannot mint if too early or too late", async () => {
      // Bob mints 10 CAKE
      for (let i = 0; i < 5; i++) {
        await mockB8D.mintTokens("2000000000000000000", { from: bob });
      }

      await mockB8D.approve(collectionMintFactory.address, "10000000000000000000", {
        from: bob,
      });

      await collectionMintFactory.setStartBlockNumber(352, { from: alice });

      // move the current block to the _endBlockTime
      await time.advanceBlockTo(350);

      await expectRevert(collectionMintFactory.mintNFT("7", { from: bob }), "too early");

      await collectionMintFactory.setEndBlockNumber(360, { from: alice });

      // move the current block to the _endBlockTime
      await time.advanceBlockTo(361);

      await expectRevert(collectionMintFactory.mintNFT("7", { from: bob }), "too late");
    });
    it("Block number functions revert as expected", async () => {
      // Admin function
      await expectRevert(collectionMintFactory.setStartBlockNumber(10, { from: alice }), "too short");

      await expectRevert(collectionMintFactory.setEndBlockNumber(10, { from: alice }), "too short");

      await collectionMintFactory.setStartBlockNumber(600, { from: alice });

      await expectRevert(collectionMintFactory.setEndBlockNumber(600, { from: alice }), "must be > startBlockNumber");

      // move the current block to 600
      await time.advanceBlockTo(600);

      await collectionMintFactory.setEndBlockNumber(1000, { from: alice });
    });

    it("Fee is changed and Bob mints", async () => {
      // 2 CAKE
      const _newPrice = "2000000000000000000";
      await collectionMintFactory.updateTokenPrice(_newPrice, { from: alice });

      result = await collectionMintFactory.mintNFT("8", { from: bob });

      expectEvent(result, "NFTMint", {
        to: bob,
        tokenId: "6",
        nftId: "8",
      });

      result = await b8dMainCollection.totalSupply();
      assert.equal(result.toString(), "6");

      assert.equal(await collectionMintFactory.hasClaimed(bob), true);

      result = await b8dMainCollection.nftCount("8");
      assert.equal(result.toString(), "1");

      result = await b8dMainCollection.getNFTNameOfTokenId("6");
      assert.equal(result, "MyNFT8");

      result = await b8dMainCollection.getNftId("6");
      assert.equal(result, "8");

      result = await mockB8D.balanceOf(collectionMintFactory.address);
      assert.equal(result, "6000000000000000000");
    });

    it("Alice can claim fee", async () => {
      await collectionMintFactory.claimFee("6000000000000000000", { from: alice });
      result = await mockB8D.balanceOf(collectionMintFactory.address);
      assert.equal(result, "0");
    });

    it("Frank cannot access functions as he is not owner", async () => {
      await expectRevert(
        collectionMintFactory.changeOwnershipNFTContract(frank, {
          from: frank,
        }),
        "Ownable: caller is not the owner"
      );

      await expectRevert(
        collectionMintFactory.claimFee("1", {
          from: frank,
        }),
        "Ownable: caller is not the owner"
      );

      await expectRevert(
        collectionMintFactory.setNFTJsonArray(
          [5, 6, 7, 8, 9],
          ["a1", "a2", "a3", "a4", "a5"],
          { from: frank }
        ),
        "Ownable: caller is not the owner"
      );

      await expectRevert(
        collectionMintFactory.setNFTNamesArray(
          [5, 6, 7, 8, 9],
          ["a1", "a2", "a3", "a4", "a5"],
          { from: frank }
        ),
        "Ownable: caller is not the owner"
      );

      await expectRevert(
        collectionMintFactory.setStartBlockNumber(1, {
          from: frank,
        }),
        "Ownable: caller is not the owner"
      );

      await expectRevert(
        collectionMintFactory.setEndBlockNumber(1, {
          from: frank,
        }),
        "Ownable: caller is not the owner"
      );

      await expectRevert(
        collectionMintFactory.updateTokenPrice(0, {
          from: frank,
        }),
        "Ownable: caller is not the owner"
      );
    });
  });
});
