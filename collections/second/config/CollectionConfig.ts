import CollectionConfigInterface from '../lib/CollectionConfigInterface';
import * as Networks from '../lib/Networks';

const CollectionConfig: CollectionConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'B8DMenagerie',
  tokenName: 'B8D Menagerie',
  tokenSymbol: 'BM',
  b8dToken: '0x4dcca80514c13dacbd4a00c4e8db891592a89306',
  contractAddress: '0x44A3020655357F836f20a1DC538d755E969fd705',
};

export default CollectionConfig;
