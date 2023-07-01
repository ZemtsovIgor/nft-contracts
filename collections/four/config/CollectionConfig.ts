import CollectionConfigInterface from '../lib/CollectionConfigInterface';
import * as Networks from '../lib/Networks';

const CollectionConfig: CollectionConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'B8DGoodGuys',
  tokenName: 'Good Guys B8',
  tokenSymbol: 'BG',
  b8dToken: '0x4dcca80514c13dacbd4a00c4e8db891592a89306',
  contractAddress: '0xFb67309473AB3758425373781Eacd858BB05afCf',
};

export default CollectionConfig;
