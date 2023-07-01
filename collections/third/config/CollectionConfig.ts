import CollectionConfigInterface from '../lib/CollectionConfigInterface';
import * as Networks from '../lib/Networks';

const CollectionConfig: CollectionConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'B8DRobots',
  tokenName: 'Robots B8',
  tokenSymbol: 'BR',
  b8dToken: '0x4dcca80514c13dacbd4a00c4e8db891592a89306',
  contractAddress: '0xf5853324DC4BA589A263563eB8a08ca7957e3d3D',
};

export default CollectionConfig;
