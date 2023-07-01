import NetworkConfigInterface from '../lib/NetworkConfigInterface';

export default interface TokenConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  b8dToken: string;
  numberB8DToReactivate: string;
  numberB8DToRegister: string;
  numberB8DToUpdate: string;
  contractAddress: string|null;
};
