import NetworkConfigInterface from '../lib/NetworkConfigInterface';

export default interface TokenConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  adminAddress: string;
  treasuryAddress: string;
  WBNBAddress: string;
  minimumAskPrice: string;
  maximumAskPrice: string;
  contractAddress: string|null;
};
