import TokenConfigInterface from '../lib/TokenConfigInterface';
import * as Networks from '../lib/Networks';

const TokenConfig: TokenConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'B8DEXMintFactoryV1',
  b8dMainCollection: '0x0304f29b4178d371bFc8B41aA9431848fbde6145',
  b8dMintingStation: '0xe59045e7ae5974DDC9Bb2889e62400F3eD89795e',
  b8dToken: '0x4dcca80514c13dacbd4a00c4e8db891592a89306',
  tokenPrice: '4000000000000000000',
  ipfsHash: 'QmUqoZuiDRmVSPka1jwiF5iW8RBaSsxsVknNAuwAysG1DS/',
  startBlockNumber: '20348146',
  endBlockNumber: '30348146',
  contractAddress: '0x33d5f191443f3B7C39E49c7B1ED3175bB3841a8c'
};

export default TokenConfig;
