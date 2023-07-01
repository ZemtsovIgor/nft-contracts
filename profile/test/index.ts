import { assert } from "chai";
// @ts-ignore
import { expectEvent, expectRevert } from "@openzeppelin/test-helpers";
import { artifacts, contract } from "hardhat";

const { gasToBNB, gasToUSD } = require("./helpers/GasCalculation");

const MockERC20 = artifacts.require("./test/MockERC20.sol");
const B8DEXMainCollection = artifacts.require("./test/B8DEXMainCollection.sol");
const B8DEXSecondCollection = artifacts.require("./test/B8DEXSecondCollection.sol");
const B8DEXProfile = artifacts.require("./B8DEXProfile.sol");

contract(
  "B8DEXProfile",
  ([alice, bob, carol, david, erin, frank]) => {

  const _totalInitSupply = "50000000000000000000"; // 50 B8D
  const _numberB8DToReactivate = "5000000000000000000";
  const _numberB8DToRegister = "5000000000000000000"; // 5 B8D
  const _numberB8DToUpdate = "2000000000000000000"; // 2 B8D
  let _testBaseURI = "test/";
  let _tokenName = 'B8DEX Token';
  let _tokenSymbol = 'B8T';
  let _nftCollectionName = 'B8DEX Fish';
  let _nftCollectionSymbol = 'BF';
  let _nftSecondCollectionName = 'B8DEX Cats';
  let _nftSecondCollectionSymbol = 'BC';

  let b8dMainCollection: any;
  let b8dSecondCollection: any;
  let mockB8D: any;
  let b8dProfile: any;

  let DEFAULT_ADMIN_ROLE: any;
  let SPECIAL_ROLE: any;
  let NFT_ROLE: any;
  let POINT_ROLE: any;

  let result: any;

  before(async () => {
    mockB8D = await MockERC20.new(
      _tokenName,
      _tokenSymbol,
      _totalInitSupply,
      { from: alice }
    );

    b8dMainCollection = await B8DEXMainCollection.new(
      _testBaseURI,
      _nftCollectionName,
      _nftCollectionSymbol,
      { from: alice }
    );

    b8dProfile = await B8DEXProfile.new(
      mockB8D.address,
      _numberB8DToReactivate,
      _numberB8DToRegister,
      _numberB8DToUpdate,
      { from: alice }
    );

    DEFAULT_ADMIN_ROLE = await b8dProfile.DEFAULT_ADMIN_ROLE();
    NFT_ROLE = await b8dProfile.NFT_ROLE();
    POINT_ROLE = await b8dProfile.POINT_ROLE();
    SPECIAL_ROLE = await b8dProfile.SPECIAL_ROLE();
  });

  // Check ticker, symbols, supply, and owners are correct
  describe("All contracts are deployed correctly", async () => {
    it("Initial parameters are correct for MockBunnies", async () => {
      assert.equal(await b8dMainCollection.name(), _nftCollectionName);
      assert.equal(await b8dMainCollection.symbol(), _nftCollectionSymbol);
      assert.equal(await b8dMainCollection.balanceOf(alice), "0");
      assert.equal(await b8dMainCollection.totalSupply(), "0");
      assert.equal(await b8dMainCollection.owner(), alice);
    });

    it("Initial parameters are correct for mockB8D", async () => {
      assert.equal(await mockB8D.name(), _tokenName);
      assert.equal(await mockB8D.symbol(), _tokenSymbol);
      assert.equal(await mockB8D.balanceOf(alice), "50000000000000000000");
      assert.equal(await mockB8D.totalSupply(), "50000000000000000000");
    });

    it("Initial parameters are correct for B8DEXProfile", async () => {
      assert.equal(await b8dProfile.b8dToken(), mockB8D.address);
      assert.equal(await b8dProfile.numberB8DToRegister(), _numberB8DToRegister);
      assert.equal(await b8dProfile.numberB8DToUpdate(), _numberB8DToUpdate);
      assert.equal(await b8dProfile.numberB8DToReactivate(), _numberB8DToReactivate);
    });
  });

  describe("Logic to register and create team works as expected", async () => {
    it("Bob cannot create a profile if teamId is invalid", async () => {
      await expectRevert(
        b8dProfile.createProfile("0", b8dMainCollection.address, "0", {
          from: bob,
        }),
        "Invalid teamId"
      );
    });

    it("Alice creates a team and data is reflected accordingly", async () => {
      result = await b8dProfile.addTeam("The Testers", "ipfs://hash/team1.json", {
        from: alice,
      });

      expectEvent(result, "TeamAdd", {
        teamId: "1",
        teamName: "The Testers",
      });

      // Verify the team is created properly
      result = await b8dProfile.getTeamProfile("1");
      assert.equal(result[0], "The Testers");
      assert.equal(result[1], "ipfs://hash/team1.json");
      assert.equal(result[2], "0");
      assert.equal(result[3], "0");
      assert.equal(result[4], true);
    });

    it("Bob cannot mint a NFT if contract address not supported", async () => {
      await expectRevert(
        b8dProfile.createProfile("1", b8dMainCollection.address, "0", {
          from: bob,
        }),
        "NFT address invalid"
      );

      result = await b8dProfile.addNftAddress(b8dMainCollection.address, {
        from: alice,
      });

      expectEvent(result, "RoleGranted", {
        role: NFT_ROLE,
        account: b8dMainCollection.address,
        sender: alice,
      });

      assert.equal(await b8dProfile.hasRole(NFT_ROLE, b8dMainCollection.address), true);
    });

    it("Bob cannot create a profile without a NFT to spend", async () => {
      // Bob is trying to spend a token that doesn't exist
      await expectRevert(
        b8dProfile.createProfile("1", b8dMainCollection.address, "0", {
          from: bob,
        }),
        "ERC721: owner query for nonexistent token"
      );

      // Bob mints a NFT
      await b8dMainCollection.mint(bob, 'to_bob', 0, { from: bob });
      assert.equal(await b8dMainCollection.balanceOf(bob), "1");
      assert.equal(await b8dMainCollection.ownerOf("0"), bob);
      assert.equal(await b8dMainCollection.totalSupply(), "1");
    });

    it("Bob cannot create a profile without approving the NFT to be spent", async () => {
      // Bob will not be able to transfer because contract not approved
      await expectRevert(
        b8dProfile.createProfile("1", b8dMainCollection.address, "0", {
          from: bob,
        }),
        "ERC721: transfer caller is not owner nor approved"
      );

      // Bob approves the contract to receive his NFT
      result = await b8dMainCollection.approve(b8dProfile.address, "0", {
        from: bob,
      });

      expectEvent(result, "Approval", {
        owner: bob,
        approved: b8dProfile.address,
        tokenId: "0",
      });
    });

    it("Bob cannot create a profile without B8D tokens in his wallet", async () => {
      // Bob doesn't have B8D
      await expectRevert(
        b8dProfile.createProfile("1", b8dMainCollection.address, "0", {
          from: bob,
        }),
        "ERC20: insufficient allowance"
      );

      // Bob mints 10 B8D
      for (let i = 0; i < 5; i++) {
        await mockB8D.mintTokens("2000000000000000000", { from: bob });
      }

      // Bob has the proper balance
      assert.equal(await mockB8D.balanceOf(bob), "10000000000000000000");
    });

    it("Bob cannot create a profile without B8D token approval to be spent", async () => {
      // Bob didn't approve B8D to be spent
      await expectRevert(
        b8dProfile.createProfile("1", b8dMainCollection.address, "0", {
          from: bob,
        }),
        "ERC20: insufficient allowance"
      );

      // Bob approves the B8D token to be spent
      result = await mockB8D.approve(b8dProfile.address, "5000000000000000000", { from: bob });

      expectEvent(result, "Approval", {
        owner: bob,
        spender: b8dProfile.address,
        value: "5000000000000000000", // 5 B8D
      });
    });

    it("Bob can finally create a profile and data is reflected as expected", async () => {
      result = await b8dProfile.createProfile("1", b8dMainCollection.address, "0", {
        from: bob,
      });

      expectEvent(result, "UserNew", {
        userAddress: bob,
        teamId: "1",
        nftAddress: b8dMainCollection.address,
        tokenId: "0",
      });

      // Team 1 has 1 user
      result = await b8dProfile.getTeamProfile("1");
      assert.equal(result[2], "1");

      // Verify Bob's balance went down and allowance must be 0
      assert.equal(await mockB8D.balanceOf(bob), "5000000000000000000");
      assert.equal(await mockB8D.allowance(bob, b8dProfile.address), "0");

      // Verify that the mock NFT went to the contract
      assert.equal(await b8dMainCollection.balanceOf(bob), "0");
      assert.equal(await b8dMainCollection.ownerOf("0"), b8dProfile.address);

      // Verify number of active profiles changed
      assert.equal(await b8dProfile.numberActiveProfiles(), "1");

      // Verify Bob has registered
      assert.equal(await b8dProfile.hasRegistered(bob), true);
    });

    it("Bob cannot register twice", async () => {
      await expectRevert(
        b8dProfile.createProfile("1", b8dMainCollection.address, "0", {
          from: bob,
        }),
        "Already registered"
      );
    });
  });

  describe("Logic to pause and reactivate a profile works as expected", async () => {
    it("Bob only can pause his profile", async () => {
      result = await b8dProfile.pauseProfile({
        from: bob,
      });

      expectEvent(result, "UserPause", {
        userAddress: bob,
        teamId: "1",
      });

      result = await b8dProfile.getUserStatus(bob);
      assert.equal(result, false);
    });

    it("NFT returned to Bob and contract statuses were updated", async () => {
      // Verify that the mock NFT went back to Bob
      assert.equal(await b8dMainCollection.balanceOf(bob), "1");
      assert.equal(await b8dMainCollection.ownerOf("0"), bob);

      // Verify there is no more active user
      assert.equal(await b8dProfile.numberActiveProfiles(), "0");

      // Verify the team has 0 active user
      result = await b8dProfile.getTeamProfile("1");
      assert.equal(result[2], "0");
    });

    it("Bob cannot pause again/update while paused/register", async () => {
      // Bob cannot pause a profile twice
      await expectRevert(
        b8dProfile.pauseProfile({
          from: bob,
        }),
        "User not active"
      );

      // Bob cannot update his own profile after it is paused
      await expectRevert(
        b8dProfile.updateProfile(b8dMainCollection.address, "0", {
          from: bob,
        }),
        "User not active"
      );

      // Bob cannot re-register
      await expectRevert(
        b8dProfile.pauseProfile({
          from: bob,
        }),
        "User not active"
      );
    });

    it("Bob reactivates his profile", async () => {
      // Bob increases allowance for address
      result = await mockB8D.increaseAllowance(b8dProfile.address, "5000000000000000000", { from: bob });

      expectEvent(result, "Approval", {
        owner: bob,
        spender: b8dProfile.address,
        value: "5000000000000000000", // 5 B8D
      });

      // Bob approves the contract to receive his NFT
      result = await b8dMainCollection.approve(b8dProfile.address, "0", {
        from: bob,
      });

      expectEvent(result, "Approval", {
        owner: bob,
        approved: b8dProfile.address,
        tokenId: "0",
      });

      // Bob reactivates his profile
      result = await b8dProfile.reactivateProfile(b8dMainCollection.address, "0", {
        from: bob,
      });

      expectEvent(result, "UserReactivate", {
        userAddress: bob,
        teamId: "1",
        nftAddress: b8dMainCollection.address,
        tokenId: "0",
      });

      // Verify there is one active user again
      assert.equal(await b8dProfile.numberActiveProfiles(), "1");
      // Verify the team has 1 active user again
      result = await b8dProfile.getTeamProfile("1");
      assert.equal(result[2], "1");

      result = await b8dProfile.getUserStatus(bob);
      assert.equal(result, true);
    });

    it("Bob cannot reactivate his profile if active", async () => {
      await expectRevert(
        b8dProfile.reactivateProfile(b8dMainCollection.address, "0", {
          from: bob,
        }),
        "User is active"
      );
    });
  });

  describe("Multiple users join the system", async () => {
    it("Carol and David mints B8D/NFTs", async () => {
      // Carol gets 10 B8D and mint NFT
      for (let i = 0; i < 20; i++) {
        await mockB8D.mintTokens("2000000000000000000", { from: carol });
      }

      await b8dMainCollection.mint(carol, 'to_carol', 1, { from: carol });

      // David gets 10 B8D and mint NFT
      for (let i = 0; i < 5; i++) {
        await mockB8D.mintTokens("2000000000000000000", { from: david });
      }

      await b8dMainCollection.mint(david, 'to_david', 2, { from: david });

      assert.equal(await b8dMainCollection.totalSupply(), "3");

      // Carol approves NFTs to be spent
      result = await b8dMainCollection.approve(b8dProfile.address, "1", {
        from: carol,
      });

      expectEvent(result, "Approval", {
        owner: carol,
        approved: b8dProfile.address,
        tokenId: "1",
      });

      // Carol approves the B8D token to be spent
      result = await mockB8D.approve(
        b8dProfile.address,
        "100000000000000000000", // 100 B8D
        { from: carol }
      );

      expectEvent(result, "Approval", {
        owner: carol,
        spender: b8dProfile.address,
        value: "100000000000000000000", // 100 B8D
      });
    });

    it("Carol tries to spend the David's NFT", async () => {
      // Carol cannot spend the NFT of David WITHOUT his consent
      await expectRevert(
        b8dProfile.createProfile("1", b8dMainCollection.address, "2", {
          from: carol,
        }),
        "Only NFT owner can register"
      );

      // David approves NFTs to be spent by Carol
      result = await b8dMainCollection.approve(carol, "2", {
        from: david,
      });

      expectEvent(result, "Approval", {
        owner: david,
        approved: carol,
        tokenId: "2",
      });

      // Carol cannot spend the NFT of David WITH his consent
      await expectRevert(
        b8dProfile.createProfile("1", b8dMainCollection.address, "2", {
          from: carol,
        }),
        "Only NFT owner can register"
      );
    });

    it("Carol creates a profile with her NFT", async () => {
      result = await b8dProfile.createProfile("1", b8dMainCollection.address, "1", { from: carol });

      expectEvent(result, "UserNew", {
        userAddress: carol,
        teamId: "1",
        nftAddress: b8dMainCollection.address,
        tokenId: "1",
      });
    });

    it("David registers and all statuses are updated accordingly", async () => {
      // David activates his profile
      await b8dMainCollection.approve(b8dProfile.address, "2", {
        from: david,
      });

      // David approves the B8D token to be spent
      await mockB8D.approve(
        b8dProfile.address,
        "10000000000000000000", // 10 B8D
        { from: david }
      );
      result = await b8dProfile.createProfile("1", b8dMainCollection.address, "2", { from: david });

      expectEvent(result, "UserNew", {
        userAddress: david,
        teamId: "1",
        nftAddress: b8dMainCollection.address,
        tokenId: "2",
      });

      result = await b8dProfile.getTeamProfile("1");
      assert.equal(result[2], "3");
      assert.equal(await b8dProfile.numberActiveProfiles(), "3");
    });
  });

  describe("Multiple NFT contracts are supported and it is possible to update profile", async () => {
    it("Alice deploys and approves a new NFT contract", async () => {
      // Alice deploys new NFT contract
      b8dSecondCollection = await B8DEXSecondCollection.new(
        _testBaseURI,
        _nftSecondCollectionName,
        _nftSecondCollectionSymbol,
        { from: alice }
      );

      // Erin mints first tokenId (0) for b8dSecondCollection
      await b8dSecondCollection.mint(erin, 'to_erin', 3, { from: erin });

      // Carol mints second tokenId (1) for b8dSecondCollection
      await b8dSecondCollection.mint(carol, 'to_carol_second', 4, { from: carol });
    });

    it("Carol cannot update her profile until it is approved", async () => {
      await expectRevert(
        b8dProfile.updateProfile(b8dSecondCollection.address, "1", {
          from: carol,
        }),
        "NFT address invalid"
      );
    });

    it("Carol pauses her profile and tries to reactivate with new NFT", async () => {
      result = await b8dProfile.pauseProfile({
        from: carol,
      });

      expectEvent(result, "UserPause", {
        userAddress: carol,
        teamId: "1",
      });

      // Carol approves NFT to be spent by
      await b8dMainCollection.approve(b8dProfile.address, "1", {
        from: carol,
      });

      await expectRevert(
        b8dProfile.reactivateProfile(b8dSecondCollection.address, "1", {
          from: carol,
        }),
        "NFT address invalid"
      );

      result = await b8dProfile.reactivateProfile(b8dMainCollection.address, "1", {
        from: carol,
      });

      expectEvent(result, "UserReactivate", {
        userAddress: carol,
        teamId: "1",
        nftAddress: b8dMainCollection.address,
        tokenId: "1",
      });
    });

    it("Alice approves a new NFT contract", async () => {
      // Alice adds the new NFT contract as supported
      result = await b8dProfile.addNftAddress(b8dSecondCollection.address, {
        from: alice,
      });

      expectEvent(result, "RoleGranted", {
        role: NFT_ROLE,
        account: b8dSecondCollection.address,
        sender: alice,
      });
    });

    it("Carol pauses her profile and tries to reactivate with Erin's NFT", async () => {
      result = await b8dProfile.pauseProfile({
        from: carol,
      });

      expectEvent(result, "UserPause", {
        userAddress: carol,
        teamId: "1",
      });

      // Erin approves her NFT contract to be spent by Carol
      await b8dSecondCollection.approve(carol, "0", {
        from: erin,
      });

      await expectRevert(
        b8dProfile.reactivateProfile(b8dSecondCollection.address, "0", {
          from: carol,
        }),
        "Only NFT owner can update"
      );

      // Carol approves NFT to be spent by
      await b8dSecondCollection.approve(b8dProfile.address, "1", {
        from: carol,
      });

      result = await b8dProfile.reactivateProfile(b8dSecondCollection.address, "1", {
        from: carol,
      });

      expectEvent(result, "UserReactivate", {
        userAddress: carol,
        teamId: "1",
        nftAddress: b8dSecondCollection.address,
        tokenId: "1",
      });
    });

    it("Erin let Carol spends her NFT for the profile but it reverts", async () => {
      // Erin approves her NFT contract to be spent by Carol
      await b8dSecondCollection.approve(carol, "0", {
        from: erin,
      });

      await expectRevert(
        b8dProfile.updateProfile(b8dSecondCollection.address, "0", {
          from: carol,
        }),
        "Only NFT owner can update"
      );
    });

    it("Erin mints and registers her token", async () => {
      // Erin mints 10 B8D
      for (let i = 0; i < 5; i++) {
        await mockB8D.mintTokens("2000000000000000000", { from: erin });
      }

      // Erin approves her NFT contract to be spent by b8dProfile
      await b8dSecondCollection.approve(b8dProfile.address, "0", {
        from: erin,
      });

      // Erin approves the B8D token to be spent by b8dProfile
      await mockB8D.approve(
        b8dProfile.address,
        "10000000000000000000", // 10 B8D
        { from: erin }
      );

      // Erin creates her B8DEX profile
      result = await b8dProfile.createProfile("1", b8dSecondCollection.address, "0", {
        from: erin,
      });

      expectEvent(result, "UserNew", {
        userAddress: erin,
        teamId: "1",
        nftAddress: b8dSecondCollection.address,
        tokenId: "0",
      });

      assert.equal(await b8dProfile.numberActiveProfiles(), "4");
      assert.equal(await b8dProfile.numberTeams(), "1");
    });

    it("Frank cannot call functions without a profiles", async () => {
      await expectRevert(
        b8dProfile.pauseProfile({
          from: frank,
        }),
        "Has not registered"
      );

      await expectRevert(
        b8dProfile.updateProfile(b8dSecondCollection.address, "0", {
          from: frank,
        }),
        "Has not registered"
      );

      await expectRevert(
        b8dProfile.reactivateProfile(b8dSecondCollection.address, "0", {
          from: frank,
        }),
        "Has not registered"
      );
    });

    it("Erin updates her profile and changes the NFT contract she had", async () => {
      // Erin mints a token for b8dMainCollection
      await b8dMainCollection.mint(erin, 'to_erin', 5, { from: erin });

      result = await b8dProfile.getUserProfile(erin);
      assert.equal(result[0], "4");
      assert.equal(result[1], "0");
      assert.equal(result[2], "1");
      assert.equal(result[3], b8dSecondCollection.address);
      assert.equal(result[4], "0");
      assert.equal(result[5], true);

      // Verify the number of users in team 1 is 4
      result = await b8dProfile.getTeamProfile("1");
      assert.equal(result[2], "4");

      // Erin approves her NFT contract to be spent by b8dProfile
      await b8dMainCollection.approve(b8dProfile.address, "3", {
        from: erin,
      });

      result = await b8dProfile.updateProfile(b8dMainCollection.address, "3", {
        from: erin,
      });

      expectEvent(result, "UserUpdate", {
        userAddress: erin,
        nftAddress: b8dMainCollection.address,
        tokenId: "3",
      });

      // Balance checks
      assert.equal(await mockB8D.balanceOf(erin), "3000000000000000000");
      assert.equal(await b8dMainCollection.balanceOf(erin), "0");
      assert.equal(await b8dMainCollection.ownerOf("3"), b8dProfile.address);
      assert.equal(await b8dMainCollection.balanceOf(b8dProfile.address), "3");
      assert.equal(await b8dSecondCollection.balanceOf(erin), "1");
      assert.equal(await b8dSecondCollection.balanceOf(b8dProfile.address), "1");
      assert.equal(await b8dSecondCollection.ownerOf("0"), erin);

      // Checking Erin's profile reflects the changes
      result = await b8dProfile.getUserProfile(erin);
      assert.equal(result[3], b8dMainCollection.address);
      assert.equal(result[4], "3");
    });

    it("Tests for view functions", async () => {
      result = await b8dProfile.getUserProfile(erin);
      assert.equal(result[3], b8dMainCollection.address);
      assert.equal(result[4], "3");

      // Frank has no profile
      await expectRevert(b8dProfile.getUserProfile(frank), "Not registered");

      // teamId doesn't exist
      await expectRevert(b8dProfile.getTeamProfile("5"), "teamId invalid");
    });
  });
});
