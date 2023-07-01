import chai, { expect, assert } from 'chai';
import ChaiAsPromised from 'chai-as-promised';
import { ethers } from 'hardhat';
import TokenConfig from '../config/TokenConfig';
import ContractArguments from '../config/ContractArguments';
import { TokenContractType } from '../lib/ContractProvider';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(ChaiAsPromised);

describe(TokenConfig.contractName, function () {
  let owner!: SignerWithAddress;
  let holder!: SignerWithAddress;
  let externalUser!: SignerWithAddress;
  let contract!: TokenContractType;
  let testNFTId1 = "3";
  let testNFTId2 = "1";


  before(async function () {
    [owner, holder, externalUser] = await ethers.getSigners();
  });

  it('Contract deployment', async function () {
    const Contract = await ethers.getContractFactory(TokenConfig.contractName);
    contract = await Contract.deploy(...ContractArguments) as TokenContractType;

    await contract.deployed();
  });

  it('Symbol is correct', async () => {
    expect(await contract.symbol()).to.equal(TokenConfig.tokenSymbol);
  });

  it('Name is correct', async () => {
    expect(await contract.name()).to.equal(TokenConfig.tokenName);
  });

  it('Total supply is 0', async () => {
    expect(await contract.balanceOf(owner.address)).to.equal('0');
  });

  it('Owner is Alice', async () => {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("NFT token is minted properly", async () => {
    await contract.mint(
      owner.address,
      'IPFSHASH/',
      testNFTId1,
    {
      from: owner.address,
    });

    assert.equal(await contract.ownerOf('0'), owner.address);
    assert.equal((await contract.balanceOf(owner.address)).toString(), '1');
    assert.equal(await contract.getNftId('0'), 3);
  });

  it("NFT token is transferred to Holder", async () => {
    await contract.transferFrom(
      owner.address,
      holder.address,
      '0',
      {
        from: owner.address,
      });
    assert.equal(await contract.ownerOf('0'), holder.address);
  });

  //
  // it('Check initial data', async function () {
  //   expect(await contract.totalSupply).to.equal(totalAmount);
  // });
});
