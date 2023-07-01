import TokenConfigInterface from '../lib/TokenConfigInterface';
import * as Networks from '../lib/Networks';

const TokenConfig: TokenConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'B8DEXNFTMarketV1',
  adminAddress: '0x447E77Cb651Ba486D59E3a024D2793f6c6B96510',
  treasuryAddress: '0x1F371a76c37DD5626F0dC9430e8e752b14b5700C',
  WBNBAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  minimumAskPrice: '5000000000000000',
  maximumAskPrice: '10000000000000000000000',
  contractAddress: '0x00c854b5bFA8e2C65bA7632Dfb9D2852e163343D',
};

export default TokenConfig;
