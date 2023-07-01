import NetworkConfigInterface from '../lib/NetworkConfigInterface';

export default interface TokenConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  baseURI: string;
  tokenName: string;
  tokenSymbol: string;
  contractAddress: string|null;
};
