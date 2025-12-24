import { ServerOptions as ChainhookServerOptions, ChainhookNodeOptions } from '@hirosystems/chainhook-client';

export interface IChainhookConfig {
  nodeUrl: string;
  apiKey?: string;
  startBlock: number;
  eventQueue: string;
  maxBatchSize: number;
  network: 'devnet' | 'testnet' | 'mainnet';
}

export interface IChainhookServerOptions extends ChainhookServerOptions {
  port: number;
  host: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface IChainhookNodeOptions extends ChainhookNodeOptions {
  network: 'devnet' | 'testnet' | 'mainnet';
  startBlock: number;
  maxBatchSize: number;
  rpcUrl: string;
  apiKey?: string;
}

export interface IChainhookEvent {
  block_identifier: {
    index: number;
    hash: string;
  };
  parent_block_identifier: {
    index: number;
    hash: string;
  };
  type: string;
  timestamp: number;
  transactions: any[];
  metadata: {
    bitcoin_anchor_block_identifier: {
      index: number;
      hash: string;
    };
    pox_cycle_index: number;
    pox_cycle_position: number;
    pox_cycle_length: number;
  };
}
