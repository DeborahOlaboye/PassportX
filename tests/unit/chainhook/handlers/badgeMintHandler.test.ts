import { BadgeMintHandler } from '@/chainhook/handlers/badgeMintHandler'
import { ChainhookEventPayload } from '@/chainhook/types/handlers'

describe('BadgeMintHandler', () => {
  let handler: BadgeMintHandler

  beforeEach(() => {
    handler = new BadgeMintHandler()
  })

  describe('canHandle', () => {
    it('should return true for badge-mint events', () => {
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
                  contract: 'SP.contract',
                  method: 'mint'
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 1000, hash: 'btc123' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 2000
        }
      }

      expect(handler.canHandle(event)).toBe(true)
    })

    it('should return false for non-badge-mint events', () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 1000, hash: 'btc123' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 2000
        }
      }

      expect(handler.canHandle(event)).toBe(false)
    })
  })

  describe('handle', () => {
    it('should generate notification for valid badge mint event', async () => {
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
                  contract: 'SP.passport-nft',
                  method: 'mint',
                  args: [
                    { value: 'user123' },
                    { value: 'badge-001' },
                    { value: 'Gold Badge' },
                    { value: 'Completed 10 verifications' }
                  ]
                }
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 1000, hash: 'btc123' },
          pox_cycle_index: 0,
          pox_cycle_position: 500,
          pox_cycle_length: 2000
        }
      }

      const notifications = await handler.handle(event)

      expect(notifications).toHaveLength(1)
      expect(notifications[0].userId).toBe('user123')
      expect(notifications[0].type).toBe('badge_received')
      expect(notifications[0].title).toContain('Gold Badge')
      expect(notifications[0].data.badgeId).toBe('badge-001')
    })

    it('should return empty array for empty transactions', async () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 1000, hash: 'btc123' },
          pox_cycle_index: 0,
          pox_cycle_position: 0,
          pox_cycle_length: 2000
        }
      }

      const notifications = await handler.handle(event)

      expect(notifications).toHaveLength(0)
    })

    it('should handle contract events correctly', async () => {
      const event: ChainhookEventPayload = {
        block_identifier: { index: 100, hash: 'abc123' },
        parent_block_identifier: { index: 99, hash: 'def456' },
        type: 'block',
        timestamp: Date.now(),
        transactions: [
          {
            transaction_index: 0,
            transaction_hash: 'tx456',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP.contract'
                },
                events: [
                  {
                    type: 'contract_event',
                    contract_address: 'SP.passport-nft',
                    topic: 'badge-mint',
                    value: {
                      userId: 'user456',
                      badgeId: 'badge-002',
                      badgeName: 'Silver Badge',
                      criteria: 'Completed 5 verifications'
                    }
                  }
                ]
              }
            ]
          }
        ],
        metadata: {
          bitcoin_anchor_block_identifier: { index: 1000, hash: 'btc123' },
          pox_cycle_index: 0,
          pox_cycle_position: 500,
          pox_cycle_length: 2000
        }
      }

      const notifications = await handler.handle(event)

      expect(notifications.length).toBeGreaterThan(0)
      expect(notifications[0].userId).toBe('user456')
    })
  })

  describe('getEventType', () => {
    it('should return badge-mint event type', () => {
      expect(handler.getEventType()).toBe('badge-mint')
    })
  })
})
