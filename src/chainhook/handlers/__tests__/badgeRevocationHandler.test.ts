import { BadgeRevocationHandler } from '../badgeRevocationHandler';
import { ChainhookEventPayload, BadgeRevocationEvent } from '../../types/handlers';

describe('BadgeRevocationHandler', () => {
  let handler: BadgeRevocationHandler;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    handler = new BadgeRevocationHandler(mockLogger);
  });

  describe('canHandle', () => {
    it('should detect badge revocation contract calls', () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: '0xblock100' },
        parent_block_identifier: { index: 99, hash: '0xblock99' },
        type: 'stacks_block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: '0xtx1',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
                  method: 'revoke-badge',
                  args: ['badge-1']
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 0, hash: '0x' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 0
        }
      };

      expect(handler.canHandle(event)).toBe(true);
    });

    it('should detect burn-badge method', () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: '0xblock100' },
        parent_block_identifier: { index: 99, hash: '0xblock99' },
        type: 'stacks_block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: '0xtx1',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
                  method: 'burn-badge',
                  args: ['badge-2']
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 0, hash: '0x' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 0
        }
      };

      expect(handler.canHandle(event)).toBe(true);
    });

    it('should not handle events without transactions', () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: '0xblock100' },
        parent_block_identifier: { index: 99, hash: '0xblock99' },
        type: 'stacks_block',
        timestamp: Date.now(),
        transactions: [],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 0, hash: '0x' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 0
        }
      };

      expect(handler.canHandle(event)).toBe(false);
    });

    it('should cache results for the same block', () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: '0xblock100' },
        parent_block_identifier: { index: 99, hash: '0xblock99' },
        type: 'stacks_block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: '0xtx1',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
                  method: 'revoke-badge',
                  args: ['badge-1']
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 0, hash: '0x' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 0
        }
      };

      handler.canHandle(event);
      const debugCalls = mockLogger.debug.mock.calls.length;
      
      handler.canHandle(event);
      
      expect(mockLogger.debug.mock.calls.length).toBeGreaterThan(debugCalls);
    });
  });

  describe('handle', () => {
    it('should extract soft revocation event from contract call', async () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: '0xblock100' },
        parent_block_identifier: { index: 99, hash: '0xblock99' },
        type: 'stacks_block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: '0xtx1',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
                  method: 'revoke-badge',
                  args: ['badge-1']
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 0, hash: '0x' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 0
        }
      };

      const notifications = await handler.handle(event);

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].type).toBe('badge_revoked');
    });

    it('should detect hard revoke from burn-badge method', async () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: '0xblock100' },
        parent_block_identifier: { index: 99, hash: '0xblock99' },
        type: 'stacks_block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: '0xtx1',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
                  method: 'burn-badge',
                  args: ['badge-2']
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 0, hash: '0x' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 0
        }
      };

      const notifications = await handler.handle(event);

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].data.revocationType).toBe('hard');
    });

    it('should handle multiple revocation events in single block', async () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: '0xblock100' },
        parent_block_identifier: { index: 99, hash: '0xblock99' },
        type: 'stacks_block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: '0xtx1',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
                  method: 'revoke-badge',
                  args: ['badge-1']
                }
              }
            ]
          },
          {
            transaction_index: 1,
            transaction_hash: '0xtx2',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
                  method: 'revoke-badge',
                  args: ['badge-2']
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 0, hash: '0x' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 0
        }
      };

      const notifications = await handler.handle(event);

      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return empty array when no revocation events', async () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: '0xblock100' },
        parent_block_identifier: { index: 99, hash: '0xblock99' },
        type: 'stacks_block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: '0xtx1',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
                  method: 'mint',
                  args: ['badge-1']
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 0, hash: '0x' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 0
        }
      };

      const notifications = await handler.handle(event);

      expect(notifications.length).toBe(0);
    });
  });

  describe('getEventType', () => {
    it('should return correct event type', () => {
      expect(handler.getEventType()).toBe('badge_revocation');
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully in canHandle', () => {
      const event: any = null;

      const result = handler.canHandle(event);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle errors gracefully in handle', async () => {
      const event: any = { transactions: null };

      const notifications = await handler.handle(event);

      expect(notifications).toEqual([]);
    });
  });
});
