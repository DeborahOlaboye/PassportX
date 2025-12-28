import { IChainhookConfig, IChainhookServerOptions, IChainhookNodeOptions } from '../types/chainhook.types';

const chainhookConfig: IChainhookConfig = {
  nodeUrl: process.env.CHAINHOOK_NODE_URL || 'http://localhost:20456',
  apiKey: process.env.CHAINHOOK_API_KEY,
  startBlock: parseInt(process.env.CHAINHOOK_START_BLOCK || '0'),
  eventQueue: process.env.CHAINHOOK_EVENT_QUEUE || 'chainhook-events',
  maxBatchSize: parseInt(process.env.CHAINHOOK_MAX_BATCH_SIZE || '100'),
  network: (process.env.STACKS_NETWORK || 'devnet') as 'devnet' | 'testnet' | 'mainnet',
};

export const getServerOptions = (): IChainhookServerOptions => ({
  port: parseInt(process.env.PORT || '3001'),
  host: '0.0.0.0',
  logLevel: (process.env.NODE_ENV === 'production' ? 'info' : 'debug') as 'debug' | 'info' | 'warn' | 'error',
});

export const getNodeOptions = (): IChainhookNodeOptions => ({
  network: chainhookConfig.network,
  startBlock: chainhookConfig.startBlock,
  maxBatchSize: chainhookConfig.maxBatchSize,
  rpcUrl: chainhookConfig.nodeUrl,
  apiKey: chainhookConfig.apiKey,
});

export default chainhookConfig;
