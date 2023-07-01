import TokenConfigInterface from '../lib/TokenConfigInterface';
import * as Networks from '../lib/Networks';

const TokenConfig: TokenConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'B8DEXMintingStationV1',
  b8dMainCollection: '0x0304f29b4178d371bFc8B41aA9431848fbde6145',
  contractAddress: '0xe59045e7ae5974DDC9Bb2889e62400F3eD89795e'
};

export default TokenConfig;
