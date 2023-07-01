import TokenConfig from './TokenConfig';

// Update the following array if you change the constructor arguments...
const ContractArguments = [
  TokenConfig.adminAddress,
  TokenConfig.treasuryAddress,
  TokenConfig.WBNBAddress,
  TokenConfig.minimumAskPrice,
  TokenConfig.maximumAskPrice
] as const;

export default ContractArguments;
