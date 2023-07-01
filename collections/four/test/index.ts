import chai, {assert, expect} from 'chai';
import ChaiAsPromised from 'chai-as-promised';
import { BigNumber } from 'ethers';
import CollectionConfig from './../config/CollectionConfig';
import { NftContractType } from '../lib/ContractProvider';
import { artifacts, contract } from "hardhat";
// @ts-ignore
import { expectEvent, expectRevert, time } from "@openzeppelin/test-helpers";

const TBCCNFTToken = artifacts.require("./B8DGoodGuys.sol");
const MockERC20 = artifacts.require("./test/MockERC20.sol");
const DEFAULT_COST = BigNumber.from(500).mul(BigNumber.from(10).pow(18)).toString();
const TBCC_MAX_SUPPLY = BigNumber.from(1000000000).mul(BigNumber.from(10).pow(18)).toString();
const DEFAULT_MAX_SUPPLY = 10000;

chai.use(ChaiAsPromised);

contract(
  CollectionConfig.contractName,
  ([owner, holder, externalUser, minterTester]) => {
    let mockTBCC: any;
    let _tokenName = 'TBCC Token';
    let _tokenSymbol = 'TBCC';
    let result: any;
    let contract!: NftContractType;

    before(async function () {
      mockTBCC = await MockERC20.new(_tokenName, _tokenSymbol, TBCC_MAX_SUPPLY, {
        from: minterTester,
      });

      contract = await TBCCNFTToken.new(
        mockTBCC.address,
        CollectionConfig.tokenName,
        CollectionConfig.tokenSymbol,
        { from: owner }
      );
    });

    // Check ticker, symbols, supply, and owner are correct
    describe("All contracts are deployed correctly", async () => {
      it("Symbol is correct", async () => {
        result = await mockTBCC.symbol();
        assert.equal(result, _tokenSymbol);
      });
      it("Name is correct", async () => {
        result = await mockTBCC.name();
        assert.equal(result, _tokenName);
      });
      it("Total supply TBCC", async () => {
        result = await mockTBCC.totalSupply();
        assert.equal(result, TBCC_MAX_SUPPLY);
      });
      it("MinterTester distributes tokens to accounts", async () => {
        result = await mockTBCC.totalSupply();
        assert.equal(result.toString(), TBCC_MAX_SUPPLY);
        result = await mockTBCC.balanceOf(minterTester);
        assert.equal(result.toString(), TBCC_MAX_SUPPLY);
        // transfer TBCC to 5 accounts
        await mockTBCC.transfer(owner, BigNumber.from(9000000).mul(BigNumber.from(10).pow(18)).toString(), { from: minterTester });
        await mockTBCC.transfer(holder, BigNumber.from(1000).mul(BigNumber.from(10).pow(18)).toString(), { from: minterTester });
        await mockTBCC.transfer(externalUser, BigNumber.from(30000).mul(BigNumber.from(10).pow(18)).toString(), { from: minterTester });
        result = await mockTBCC.balanceOf(minterTester);
        assert.equal(result.toString(), '990969000000000000000000000');
      });
    });

    describe("Check initial data", async () => {
      it('Check initial data', async function () {
        expect(await contract.name()).to.equal(CollectionConfig.tokenName);
        expect(await contract.symbol()).to.equal(CollectionConfig.tokenSymbol);
        expect((await contract.b8dCost()).toString()).to.equal(DEFAULT_COST);
        expect((await contract.maxSupply()).toString()).to.equal(`${DEFAULT_MAX_SUPPLY}`);
        expect(await contract.paused()).to.equal(true);

        await expect(contract.tokenURI(1)).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');
      });
    });

    describe("Before any sale", async () => {
      it('Before any sale', async function () {
        // Nobody should be able to mint from a paused contract
        await expectRevert(contract.mintNFT('0', { from: holder }), "The contract is paused!");
        await expectRevert(contract.mintNFT('1', { from: owner }), "The contract is paused!");

        // The owner should always be able to run mintForAddress
        result = await contract.mintForAddress(owner, '5', { from: owner });

        // Obtain gas used from the receipt
        expectEvent(result, "Transfer", {
          from: '0x0000000000000000000000000000000000000000',
          to: owner,
          tokenId: "1",
        });

        await expectRevert(contract.mintForAddress(
          holder,
          '2',
          { from: holder }
        ), "Ownable: caller is not the owner");

        // Check balances
        result = await contract.balanceOf(owner);
        assert.equal(result, 1);

        result = await contract.balanceOf(holder);
        assert.equal(result, 0);

        result = await contract.balanceOf(externalUser);
        assert.equal(result, 0);
      });
    });

    describe("Minting", async () => {
      it('Pre-sale (same as public sale)', async function () {
        await contract.setPaused(false);

        // TBCC was not approved
        await expectRevert(contract.mintNFT('2', { from: holder }), "ERC20: insufficient allowance");

        result = await mockTBCC.approve(contract.address, BigNumber.from(1000).mul(BigNumber.from(10).pow(18)).toString(), { from: holder });

        expectEvent(result, "Approval");

        result = await contract.mintNFT('2', { from: holder });

        // Obtain gas used from the receipt
        expectEvent(result, "Transfer", {
          from: '0x0000000000000000000000000000000000000000',
          to: holder,
          tokenId: "2",
        });

        result = await contract.mintNFT('2', { from: holder });

        // Obtain gas used from the receipt
        expectEvent(result, "Transfer", {
          from: '0x0000000000000000000000000000000000000000',
          to: holder,
          tokenId: "3",
        });

        // Sending insufficient funds
        await expectRevert(contract.mintNFT('1', { from: holder }), "Insufficient funds!");

        // Pause pre-sale
        await contract.setPaused(true);
        await contract.setCost(BigNumber.from(200).mul(BigNumber.from(10).pow(18)).toString());
      });

      it('Owner only functions', async function () {
        await expectRevert(contract.mintForAddress(externalUser, '10',{ from: externalUser }), "Ownable: caller is not the owner");
        await expectRevert(contract.setCost(BigNumber.from(200).mul(BigNumber.from(10).pow(18)).toString(), { from: externalUser }), "Ownable: caller is not the owner");
        await expectRevert(contract.setUriPrefix('INVALID_PREFIX', { from: externalUser }), "Ownable: caller is not the owner");
        await expectRevert(contract.setUriSuffix('INVALID_SUFFIX', { from: externalUser }), "Ownable: caller is not the owner");
        await expectRevert(contract.setPaused(false, { from: externalUser }), "Ownable: caller is not the owner");
        await expectRevert(contract.withdraw({ from: externalUser }), "Ownable: caller is not the owner");
      });

      it('Wallet of owner', async function () {
        result = await contract.walletOfOwner(owner);
        assert.equal(result.toString(), '1');

        result = await contract.walletOfOwner(holder);
        assert.equal(result.toString(), '2,3');

        result = await contract.walletOfOwner(externalUser);
        assert.equal(result.toString(), '');
      });

      it('Supply checks (long)', async function () {
        const alreadyMinted = 3;
        const maxMintAmountPerTx = 1;
        const iterations = Math.floor((100 - alreadyMinted) / maxMintAmountPerTx);
        const expectedTotalSupply = iterations * maxMintAmountPerTx + alreadyMinted;
        const lastMintAmount = 100 - expectedTotalSupply;

        result = await contract.totalSupply();
        assert.equal(result.toString(), alreadyMinted);

        await contract.setPaused(false);

        await mockTBCC.transfer(holder, BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)).toString(), { from: minterTester });
        await mockTBCC.approve(contract.address, BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)).toString(), { from: holder });
        await mockTBCC.approve(contract.address, BigNumber.from(9000000).mul(BigNumber.from(10).pow(18)).toString(), { from: owner });

        await Promise.all(
          [...Array(iterations).keys()].map(
            async () => await contract.mintNFT('1', { from: holder })
          )
        );

        result = await contract.totalSupply();
        assert.equal(result.toString(), expectedTotalSupply);

        // Mint last tokens with owner address and test walletOfOwner(...)
        result = await contract.mintNFT('1', { from: owner });

        // Obtain gas used from the receipt
        expectEvent(result, "Transfer", {
          from: '0x0000000000000000000000000000000000000000',
          to: owner,
          tokenId: "101",
        });

        let expectedWalletOfOwner = '1,101';

        for (const i of [...Array(lastMintAmount).keys()].reverse()) {
          expectedWalletOfOwner = expectedWalletOfOwner + ',' + BigNumber.from(DEFAULT_MAX_SUPPLY - i);
        }

        result = await contract.walletOfOwner(owner);
        assert.equal(result.toString(), expectedWalletOfOwner);

        result = await contract.totalSupply();
        assert.equal(result.toString(), '101');
      });

      it('Supply checks (long) 2', async function () {
        const alreadyMinted = 101;
        const maxMintAmountPerTx = 1;
        const iterations = Math.floor((200 - alreadyMinted) / maxMintAmountPerTx);
        const expectedTotalSupply = iterations * maxMintAmountPerTx + alreadyMinted;
        const lastMintAmount = 200 - expectedTotalSupply;

        result = await contract.totalSupply();
        assert.equal(result.toString(), alreadyMinted);

        await contract.setPaused(false);

        await mockTBCC.transfer(holder, BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)).toString(), { from: minterTester });
        await mockTBCC.approve(contract.address, BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)).toString(), { from: holder });
        await mockTBCC.approve(contract.address, BigNumber.from(9000000).mul(BigNumber.from(10).pow(18)).toString(), { from: owner });

        await Promise.all(
          [...Array(iterations).keys()].map(
            async () => await contract.mintNFT('1', { from: holder })
          )
        );

        result = await contract.totalSupply();
        assert.equal(result.toString(), expectedTotalSupply);

        // Mint last tokens with owner address and test walletOfOwner(...)
        result = await contract.mintNFT('1', { from: owner });

        // Obtain gas used from the receipt
        expectEvent(result, "Transfer", {
          from: '0x0000000000000000000000000000000000000000',
          to: owner,
          tokenId: "201",
        });

        let expectedWalletOfOwner = '1,101,201';

        for (const i of [...Array(lastMintAmount).keys()].reverse()) {
          expectedWalletOfOwner = expectedWalletOfOwner + ',' + BigNumber.from(DEFAULT_MAX_SUPPLY - i);
        }

        result = await contract.walletOfOwner(owner);
        assert.equal(result.toString(), expectedWalletOfOwner);

        result = await contract.totalSupply();
        assert.equal(result.toString(), '201');
      });

      it('Supply checks (long) 3', async function () {
        const alreadyMinted = 201;
        const maxMintAmountPerTx = 1;
        const iterations = Math.floor((300 - alreadyMinted) / maxMintAmountPerTx);
        const expectedTotalSupply = iterations * maxMintAmountPerTx + alreadyMinted;
        const lastMintAmount = 300 - expectedTotalSupply;

        result = await contract.totalSupply();
        assert.equal(result.toString(), alreadyMinted);

        await contract.setPaused(false);

        await mockTBCC.transfer(holder, BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)).toString(), { from: minterTester });
        await mockTBCC.approve(contract.address, BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)).toString(), { from: holder });
        await mockTBCC.approve(contract.address, BigNumber.from(9000000).mul(BigNumber.from(10).pow(18)).toString(), { from: owner });

        await Promise.all(
          [...Array(iterations).keys()].map(
            async () => await contract.mintNFT('1', { from: holder })
          )
        );

        result = await contract.totalSupply();
        assert.equal(result.toString(), expectedTotalSupply);

        // Mint last tokens with owner address and test walletOfOwner(...)
        result = await contract.mintNFT('1', { from: owner });

        // Obtain gas used from the receipt
        expectEvent(result, "Transfer", {
          from: '0x0000000000000000000000000000000000000000',
          to: owner,
          tokenId: "301",
        });

        let expectedWalletOfOwner = '1,101,201,301';

        for (const i of [...Array(lastMintAmount).keys()].reverse()) {
          expectedWalletOfOwner = expectedWalletOfOwner + ',' + BigNumber.from(DEFAULT_MAX_SUPPLY - i);
        }

        result = await contract.walletOfOwner(owner);
        assert.equal(result.toString(), expectedWalletOfOwner);

        result = await contract.totalSupply();
        assert.equal(result.toString(), '301');
      });

      it('Supply checks (long) 4', async function () {
        const alreadyMinted = 301;
        const maxMintAmountPerTx = 1;
        const iterations = Math.floor((1000 - alreadyMinted) / maxMintAmountPerTx);
        const expectedTotalSupply = iterations * maxMintAmountPerTx + alreadyMinted;
        const lastMintAmount = 1000 - expectedTotalSupply;

        result = await contract.totalSupply();
        assert.equal(result.toString(), alreadyMinted);

        await contract.setPaused(false);

        await mockTBCC.transfer(holder, BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)).toString(), { from: minterTester });
        await mockTBCC.approve(contract.address, BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)).toString(), { from: holder });
        await mockTBCC.approve(contract.address, BigNumber.from(9000000).mul(BigNumber.from(10).pow(18)).toString(), { from: owner });

        await Promise.all(
          [...Array(iterations).keys()].map(
            async () => await contract.mintNFT('1', { from: holder })
          )
        );

        result = await contract.totalSupply();
        assert.equal(result.toString(), expectedTotalSupply);

        // Mint last tokens with owner address and test walletOfOwner(...)
        result = await contract.mintNFT('1', { from: owner });

        // Obtain gas used from the receipt
        expectEvent(result, "Transfer", {
          from: '0x0000000000000000000000000000000000000000',
          to: owner,
          tokenId: "1001",
        });

        let expectedWalletOfOwner = '1,101,201,301,1001';

        for (const i of [...Array(lastMintAmount).keys()].reverse()) {
          expectedWalletOfOwner = expectedWalletOfOwner + ',' + BigNumber.from(DEFAULT_MAX_SUPPLY - i);
        }

        result = await contract.walletOfOwner(owner);
        assert.equal(result.toString(), expectedWalletOfOwner);

        result = await contract.totalSupply();
        assert.equal(result.toString(), '1001');
      });

      it('Supply checks (long) 5', async function () {
        const alreadyMinted = 1001;
        const maxMintAmountPerTx = 1;
        const iterations = Math.floor((2000 - alreadyMinted) / maxMintAmountPerTx);
        const expectedTotalSupply = iterations * maxMintAmountPerTx + alreadyMinted;
        const lastMintAmount = 2000 - expectedTotalSupply;

        result = await contract.totalSupply();
        assert.equal(result.toString(), alreadyMinted);

        await contract.setPaused(false);

        await mockTBCC.transfer(holder, BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)).toString(), { from: minterTester });
        await mockTBCC.approve(contract.address, BigNumber.from(1000000).mul(BigNumber.from(10).pow(18)).toString(), { from: holder });
        await mockTBCC.approve(contract.address, BigNumber.from(9000000).mul(BigNumber.from(10).pow(18)).toString(), { from: owner });

        await Promise.all(
          [...Array(iterations).keys()].map(
            async () => await contract.mintNFT('1', { from: holder })
          )
        );

        result = await contract.totalSupply();
        assert.equal(result.toString(), expectedTotalSupply);

        // Mint last tokens with owner address and test walletOfOwner(...)
        result = await contract.mintNFT('1', { from: owner });

        // Obtain gas used from the receipt
        expectEvent(result, "Transfer", {
          from: '0x0000000000000000000000000000000000000000',
          to: owner,
          tokenId: "2001",
        });

        let expectedWalletOfOwner = '1,101,201,301,1001,2001';

        for (const i of [...Array(lastMintAmount).keys()].reverse()) {
          expectedWalletOfOwner = expectedWalletOfOwner + ',' + BigNumber.from(DEFAULT_MAX_SUPPLY - i);
        }

        result = await contract.walletOfOwner(owner);
        assert.equal(result.toString(), expectedWalletOfOwner);

        result = await contract.totalSupply();
        assert.equal(result.toString(), '2001');
      });
    });

    describe("Whitelisting works as intended", async () => {
      it('Token URI generation', async () => {
        const uriPrefix = 'ipfs://__COLLECTION_CID__/';
        const uriSuffix = '.json';

        // Reveal collection
        await contract.setUriPrefix(uriPrefix);

        // ERC721A uses token IDs starting from 0 internally...
        await expect(
          contract.tokenURI(0)
        ).to.be.revertedWith('ERC721Metadata: URI query for nonexistent token');

        // Testing first and last minted tokens
        expect(await contract.tokenURI(1)).to.equal(`${uriPrefix}5${uriSuffix}`);
        expect(await contract.tokenURI(2)).to.equal(`${uriPrefix}2${uriSuffix}`);
      });
    });
  }
);
