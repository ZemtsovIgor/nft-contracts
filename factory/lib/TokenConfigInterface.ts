import NetworkConfigInterface from '../lib/NetworkConfigInterface';

export default interface TokenConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  b8dMainCollection: string;
  b8dMintingStation: string;
  b8dToken: string;
  tokenPrice: string;
  ipfsHash: string;
  startBlockNumber: string;
  endBlockNumber: string;
  contractAddress: string|null;
};
