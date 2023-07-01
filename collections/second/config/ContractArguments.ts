import CollectionConfig from './CollectionConfig';

// Update the following array if you change the constructor arguments...
const ContractArguments = [
  CollectionConfig.b8dToken,
  CollectionConfig.tokenName,
  CollectionConfig.tokenSymbol
] as const;

export default ContractArguments;
