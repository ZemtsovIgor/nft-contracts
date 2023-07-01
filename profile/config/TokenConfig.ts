import TokenConfigInterface from '../lib/TokenConfigInterface';
import * as Networks from '../lib/Networks';

const TokenConfig: TokenConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'B8DEXProfileV1',
  b8dToken: '0x4dcCa80514c13dAcBd4A00c4E8dB891592a89306',
  numberB8DToReactivate: '500000000000000000',
  numberB8DToRegister: '500000000000000000',
  numberB8DToUpdate: '1000000000000000',
  contractAddress: '0xD472d9D2Ba33890ab954381f73439e247CC4D8bC',
};

export default TokenConfig;
