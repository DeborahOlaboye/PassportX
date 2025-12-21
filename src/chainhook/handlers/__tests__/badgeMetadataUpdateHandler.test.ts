import { BadgeMetadataUpdateHandler } from '../badgeMetadataUpdateHandler';
import { ChainhookEventPayload, BadgeMetadataUpdateEvent } from '../../types/handlers';

describe('BadgeMetadataUpdateHandler', () => {
  let handler: BadgeMetadataUpdateHandler;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    handler = new BadgeMetadataUpdateHandler(mockLogger);
  });

  describe('canHandle', () => {
    it('should detect metadata update contract calls', () => {
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
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-metadata',
                  method: 'update-metadata',
                  args: []
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
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-metadata',
                  method: 'update-metadata',
                  args: []
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
      handler.canHandle(event);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Cache hit for metadata update event'),
        expect.anything()
      );
    });
  });

  describe('handle', () => {
    it('should extract metadata update event from contract call', async () => {
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
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-metadata',
                  method: 'update-metadata',
                  args: [
                    { value: 'badge-1' },
                    { value: 'Achievement Badge' },
                    { value: 5 },
                    { value: 'achievement' },
                    { value: 'Completed a task' },
                    { value: 3 },
                    { value: 'task' },
                    { value: 'Completed an old task' }
                  ]
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

      const result = await handler.handle(event);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('badge_metadata_updated');
      expect(result[0].data.badgeId).toBe('badge-1');
      expect(result[0].data.level).toBe(5);
      expect(result[0].data.previousLevel).toBe(3);
    });

    it('should return empty array for null event', async () => {
      const result = await handler.handle(null as any);
      expect(result).toEqual([]);
    });

    it('should return empty array for event without transactions', async () => {
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

      const result = await handler.handle(event);
      expect(result).toEqual([]);
    });

    it('should handle missing badge ID gracefully', async () => {
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
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-metadata',
                  method: 'update-metadata',
                  args: []
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

      const result = await handler.handle(event);
      expect(result).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getEventType', () => {
    it('should return correct event type', () => {
      expect(handler.getEventType()).toBe('badge-metadata-update');
    });
  });
});
