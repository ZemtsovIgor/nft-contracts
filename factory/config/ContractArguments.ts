import TokenConfig from './TokenConfig';

// Update the following array if you change the constructor arguments...
const ContractArguments = [
  TokenConfig.b8dMainCollection,
  TokenConfig.b8dMintingStation,
  TokenConfig.b8dToken,
  TokenConfig.tokenPrice,
  TokenConfig.ipfsHash,
  TokenConfig.startBlockNumber,
  TokenConfig.endBlockNumber
] as const;

export default ContractArguments;
