import { NotificationService } from '@/chainhook/services/notificationService'
import { NotificationDeliveryService } from '@/chainhook/services/notificationDeliveryService'
import { ChainhookNotificationIntegration } from '@/chainhook/services/chainhookNotificationIntegration'
import { BadgeMintHandler } from '@/chainhook/handlers/badgeMintHandler'
import { BadgeVerificationHandler } from '@/chainhook/handlers/badgeVerificationHandler'
import { ChainhookEventPayload } from '@/chainhook/types/handlers'

describe('Chainhook Notification Integration Flow', () => {
  beforeEach(() => {
    ChainhookNotificationIntegration.initialize()
  })

  describe('End-to-End Notification Flow', () => {
    it('should process badge mint event and deliver notification', async () => {
      const userId = 'test-user-123'
      const badgeName = 'Test Badge'

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
                    { value: userId },
                    { value: 'badge-001' },
                    { value: badgeName },
                    { value: 'Test criteria' }
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

      const notifications = await NotificationService.processEvent(event, {})

      expect(notifications.length).toBeGreaterThan(0)
      expect(notifications[0].userId).toBe(userId)
      expect(notifications[0].type).toBe('badge_received')
      expect(notifications[0].title).toContain(badgeName)
    })

    it('should respect user notification preferences', async () => {
      const userId = 'user-with-prefs'

      const preferences = {
        userId,
        badges: {
          enabled: true,
          mint: false,
          verify: true
        },
        community: {
          enabled: true,
          updates: true,
          invites: true
        },
        system: {
          enabled: true,
          announcements: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await NotificationService.setUserPreferences(userId, preferences)

      const badgeMintNotification = {
        userId,
        type: 'badge_received' as const,
        title: 'Badge Test',
        message: 'Test message',
        data: { eventType: 'test', transactionHash: 'tx123', blockHeight: 100, timestamp: Date.now() }
      }

      const filtered = await NotificationService.filterNotificationsByPreferences(
        [badgeMintNotification],
        preferences
      )

      expect(filtered).toHaveLength(0)
    })

    it('should deliver multiple notifications', async () => {
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
                    { value: 'user-1' },
                    { value: 'badge-001' },
                    { value: 'Badge 1' },
                    { value: 'Criteria 1' }
                  ]
                }
              }
            ]
          },
          {
            transaction_index: 1,
            transaction_hash: 'tx124',
            operations: [
              {
                type: 'contract_call',
                contract_call: {
                  contract: 'SP.passport-nft',
                  method: 'mint',
                  args: [
                    { value: 'user-2' },
                    { value: 'badge-002' },
                    { value: 'Badge 2' },
                    { value: 'Criteria 2' }
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

      const notifications = await NotificationService.processEvent(event, {})

      expect(notifications.length).toBeGreaterThanOrEqual(2)
      expect(notifications.map(n => n.userId)).toContain('user-1')
      expect(notifications.map(n => n.userId)).toContain('user-2')
    })

    it('should store notifications in delivery service', async () => {
      const userId = 'delivery-test-user'
      const notification = {
        userId,
        type: 'badge_received' as const,
        title: 'Test Delivery',
        message: 'Notification delivery test',
        data: { eventType: 'test', transactionHash: 'tx123', blockHeight: 100, timestamp: Date.now() }
      }

      const delivered = await NotificationDeliveryService.deliverNotification(notification)

      expect(delivered).toBeDefined()
      expect(delivered._id).toBeDefined()
      expect(delivered.userId).toBe(userId)
      expect(delivered.read).toBe(false)

      const userNotifications = await NotificationDeliveryService.getUserNotifications(userId)
      expect(userNotifications.length).toBeGreaterThan(0)
      expect(userNotifications[0].userId).toBe(userId)
    })

    it('should mark notifications as read', async () => {
      const userId = 'read-test-user'
      const notification = {
        userId,
        type: 'badge_received' as const,
        title: 'Test Read',
        message: 'Notification read test',
        data: { eventType: 'test', transactionHash: 'tx123', blockHeight: 100, timestamp: Date.now() }
      }

      const delivered = await NotificationDeliveryService.deliverNotification(notification)
      const unreadBefore = await NotificationDeliveryService.getUnreadCount(userId)

      await NotificationDeliveryService.markNotificationAsRead(userId, delivered._id)

      const unreadAfter = await NotificationDeliveryService.getUnreadCount(userId)

      expect(unreadBefore).toBeGreaterThan(0)
      expect(unreadAfter).toBe(unreadBefore - 1)
    })

    it('should filter notifications by type', async () => {
      const userId = 'filter-test-user'

      const badgeNotification = {
        userId,
        type: 'badge_received' as const,
        title: 'Badge Test',
        message: 'Badge notification',
        data: { eventType: 'test', transactionHash: 'tx123', blockHeight: 100, timestamp: Date.now() }
      }

      const communityNotification = {
        userId,
        type: 'community_update' as const,
        title: 'Community Test',
        message: 'Community notification',
        data: { eventType: 'test', transactionHash: 'tx124', blockHeight: 101, timestamp: Date.now() }
      }

      await NotificationDeliveryService.deliverNotification(badgeNotification)
      await NotificationDeliveryService.deliverNotification(communityNotification)

      const badgeNotifications = await NotificationDeliveryService.getNotificationsByType(
        userId,
        'badge_received'
      )

      expect(badgeNotifications.length).toBeGreaterThan(0)
      expect(badgeNotifications.every(n => n.type === 'badge_received')).toBe(true)
    })

    it('should handle user preference updates', async () => {
      const userId = 'prefs-update-user'

      const initialPrefs = await NotificationService.createDefaultPreferences(userId)
      expect(initialPrefs.badges.mint).toBe(true)

      await NotificationService.disableNotificationType(userId, 'badge_received')

      const updated = await NotificationService.getUserPreferences(userId)
      expect(updated?.badges.mint).toBe(false)

      await NotificationService.enableNotificationType(userId, 'badge_received')

      const re_enabled = await NotificationService.getUserPreferences(userId)
      expect(re_enabled?.badges.mint).toBe(true)
    })

    it('should clear old notifications', async () => {
      const userId = 'old-notif-user'

      const notification = {
        userId,
        type: 'badge_received' as const,
        title: 'Old Test',
        message: 'Old notification',
        data: { eventType: 'test', transactionHash: 'tx123', blockHeight: 100, timestamp: Date.now() }
      }

      await NotificationDeliveryService.deliverNotification(notification)

      const countBefore = NotificationDeliveryService.getUserNotificationCount(userId)
      await NotificationDeliveryService.clearOldNotifications(userId, 0)
      const countAfter = NotificationDeliveryService.getUserNotificationCount(userId)

      expect(countAfter).toBeLessThanOrEqual(countBefore)
    })
  })
})
