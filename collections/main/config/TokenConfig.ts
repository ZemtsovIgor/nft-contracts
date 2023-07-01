import TokenConfigInterface from '../lib/TokenConfigInterface';
import * as Networks from '../lib/Networks';

const TokenConfig: TokenConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'B8DEXMainCollectionV1',
  baseURI: 'ipfs://',
  tokenName: 'B8DEX Fish',
  tokenSymbol: 'BF',
  contractAddress: '0x0304f29b4178d371bFc8B41aA9431848fbde6145'
};

export default TokenConfig;
