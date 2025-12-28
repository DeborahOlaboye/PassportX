import { CommunityCreationHandler } from '../communityCreationHandler';
import { ChainhookEventPayload, NotificationPayload } from '../../types/handlers';

describe('CommunityCreationHandler', () => {
  let handler: CommunityCreationHandler;

  beforeEach(() => {
    handler = new CommunityCreationHandler();
  });

  describe('canHandle', () => {
    it('should return true for create-community contract calls', () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: 'tx123',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
                  method: 'create-community',
                  args: []
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 50, hash: 'xyz789' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 2100
        }
      };

      expect(handler.canHandle(event)).toBe(true);
    });

    it('should return true for community creation events', () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: 'tx123',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
                  method: 'other-method'
                }
              },
              {
                type: 'emit',
                events: [
                  {
                    type: 'contract_event',
                    contract_address: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
                    topic: 'community-created',
                    value: {}
                  }
                ]
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 50, hash: 'xyz789' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 2100
        }
      };

      expect(handler.canHandle(event)).toBe(true);
    });

    it('should return false for non-community events', () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: 'tx123',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
                  method: 'mint'
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 50, hash: 'xyz789' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 2100
        }
      };

      expect(handler.canHandle(event)).toBe(false);
    });

    it('should return false for empty transactions', () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 50, hash: 'xyz789' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 2100
        }
      };

      expect(handler.canHandle(event)).toBe(false);
    });
  });

  describe('handle', () => {
    it('should create notification for community creation', async () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: 'tx123',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
                  method: 'create-community',
                  args: [
                    { value: 'community-1' },
                    { value: 'My Community' },
                    { value: 'A great community' }
                  ]
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 50, hash: 'xyz789' },
          pox_cycle_index: 0,
          pox_cycle_position: 100,
          pox_cycle_length: 2100
        }
      };

      const notifications = await handler.handle(event);

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0]).toHaveProperty('userId');
      expect(notifications[0]).toHaveProperty('type');
      expect(notifications[0]).toHaveProperty('title');
      expect(notifications[0]).toHaveProperty('message');
      expect(notifications[0]).toHaveProperty('data');
    });

    it('should return empty array for non-community events', async () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: 'tx123',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.badge-issuer',
                  method: 'mint'
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 50, hash: 'xyz789' },
          pox_cycle_index: 0,
          pox_cycle_position: 100,
          pox_cycle_length: 2100
        }
      };

      const notifications = await handler.handle(event);

      expect(notifications).toEqual([]);
    });

    it('should return empty array for events with no transactions', async () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 50, hash: 'xyz789' },
          pox_cycle_index: 0,
          pox_cycle_position: 100,
          pox_cycle_length: 2100
        }
      };

      const notifications = await handler.handle(event);

      expect(notifications).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const event: any = null;

      const notifications = await handler.handle(event);

      expect(notifications).toEqual([]);
    });
  });

  describe('getEventType', () => {
    it('should return correct event type', () => {
      expect(handler.getEventType()).toBe('community-creation');
    });
  });

  describe('notification structure', () => {
    it('should create valid notification payload', async () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: 'tx-hash-123',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
                  method: 'create-community',
                  args: [
                    { value: 'test-community' },
                    { value: 'Test Community' },
                    { value: 'A test community' }
                  ]
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 50, hash: 'xyz789' },
          pox_cycle_index: 0,
          pox_cycle_position: 100,
          pox_cycle_length: 2100
        }
      };

      const notifications = await handler.handle(event);

      expect(notifications.length).toBeGreaterThan(0);
      const notification = notifications[0];

      expect(notification.type).toBe('community_created');
      expect(notification.title).toContain('Test Community');
      expect(notification.message).toContain('blockchain');
      expect(notification.data.eventType).toBe('community-creation');
      expect(notification.data.communityId).toBe('test-community');
      expect(notification.data.communityName).toBe('Test Community');
      expect(notification.data.transactionHash).toBe('tx-hash-123');
      expect(notification.data.blockHeight).toBe(100);
    });
  });
});
