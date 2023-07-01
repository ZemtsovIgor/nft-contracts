import TokenConfig from './TokenConfig';

// Update the following array if you change the constructor arguments...
const ContractArguments = [
  TokenConfig.b8dToken,
  TokenConfig.numberB8DToReactivate,
  TokenConfig.numberB8DToRegister,
  TokenConfig.numberB8DToUpdate
] as const;

export default ContractArguments;
