import TokenConfig from './TokenConfig';

// Update the following array if you change the constructor arguments...
const ContractArguments = [
  TokenConfig.baseURI,
  TokenConfig.tokenName,
  TokenConfig.tokenSymbol
] as const;

export default ContractArguments;
