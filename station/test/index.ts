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


  before(async function () {
    [owner, holder, externalUser] = await ethers.getSigners();
  });

  it('Contract deployment', async function () {
    const Contract = await ethers.getContractFactory(TokenConfig.contractName);
    contract = await Contract.deploy(...ContractArguments) as TokenContractType;

    await contract.deployed();
  });
});
