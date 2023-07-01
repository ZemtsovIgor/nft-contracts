import NetworkConfigInterface from '../lib/NetworkConfigInterface';

export default interface CollectionConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  tokenName: string;
  tokenSymbol: string;
  b8dToken: string;
  contractAddress: string|null;
};
