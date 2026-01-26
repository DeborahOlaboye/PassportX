/**
 * Error handling and edge case tests for contract hooks
 * Tests comprehensive error scenarios and failure modes
 */

import { renderHook, act } from '@testing-library/react'
import { useIssueBadge } from '../useIssueBadge'
import { useCreateCommunity } from '../useCreateCommunity'
import { useAuth } from '@/contexts/AuthContext'

jest.mock('@/contexts/AuthContext')
jest.mock('@/lib/contracts/badgeContractUtils')
jest.mock('@/lib/contracts/communityContractUtils')

describe('Contract Hooks - Error Handling Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: {
        stacksAddress: 'STTEST123',
        username: 'testuser'
      },
      userSession: {
        isUserSignedIn: jest.fn(() => true),
        loadUserData: jest.fn(() => ({
          profile: {
            stxAddress: {
              testnet: 'STTEST123',
              mainnet: 'SPTEST123'
            }
          }
        }))
      }
    })
  })

  describe('useIssueBadge - Error Handling', () => {
    it('should handle transaction rejection gracefully', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const userRejectionError = new Error('User rejected the transaction')

      BadgeIssuerManager.prototype.issueBadge = jest
        .fn()
        .mockRejectedValue(userRejectionError)

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'ST123',
            templateId: 1,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBe('User rejected the transaction')
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle insufficient balance error', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const insufficientError = new Error('Insufficient STX balance')

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockRejectedValue(insufficientError)

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'ST456',
            templateId: 2,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBe('Insufficient STX balance')
    })

    it('should handle contract not found error', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const notFoundError = new Error('Contract not found on network')

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockRejectedValue(notFoundError)

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'ST789',
            templateId: 3,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBe('Contract not found on network')
    })

    it('should handle malformed parameters error', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const paramError = new Error('Invalid recipient address format')

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockRejectedValue(paramError)

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'INVALID',
            templateId: 1,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBe('Invalid recipient address format')
    })

    it('should handle template not found error', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const templateError = new Error('Badge template does not exist')

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockRejectedValue(templateError)

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'ST999',
            templateId: 99999,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBe('Badge template does not exist')
    })

    it('should handle authorization error for revoke', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const authError = new Error('Only badge issuer can revoke badges')

      BadgeIssuerManager.prototype.revokeBadge = jest.fn().mockRejectedValue(authError)

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.revokeBadge(1)
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBe('Only badge issuer can revoke badges')
    })

    it('should handle timeout error', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const timeoutError = new Error('Request timeout after 30000ms')

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockRejectedValue(timeoutError)

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'ST111',
            templateId: 1,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toContain('timeout')
    })

    it('should handle network connection error', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const networkError = new Error('Failed to connect to blockchain network')

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockRejectedValue(networkError)

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'ST222',
            templateId: 2,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toContain('blockchain network')
    })

    it('should handle reorg error', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const reorgError = new Error('Blockchain reorganization detected - transaction reverted')

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockRejectedValue(reorgError)

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'ST333',
            templateId: 3,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toContain('reorganization')
    })
  })

  describe('useCreateCommunity - Error Handling', () => {
    it('should handle duplicate community name error', async () => {
      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      const dupError = new Error('Community name already taken')

      CommunityContractManager.prototype.createCommunity = jest
        .fn()
        .mockRejectedValue(dupError)

      const { result } = renderHook(() => useCreateCommunity())

      await act(async () => {
        try {
          await result.current.createCommunity({
            name: 'Existing Community',
            description: 'Test',
            stxPayment: 500,
            settings: {
              allowMemberInvites: true,
              requireApproval: false,
              allowBadgeIssuance: true,
              allowCustomBadges: true
            }
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBe('Community name already taken')
    })

    it('should handle insufficient STX payment error', async () => {
      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      const paymentError = new Error('Minimum STX payment is 100 microSTX')

      CommunityContractManager.prototype.createCommunity = jest
        .fn()
        .mockRejectedValue(paymentError)

      const { result } = renderHook(() => useCreateCommunity())

      await act(async () => {
        try {
          await result.current.createCommunity({
            name: 'Low Payment Community',
            description: 'Test',
            stxPayment: 10, // Too low
            settings: {
              allowMemberInvites: true,
              requireApproval: false,
              allowBadgeIssuance: true,
              allowCustomBadges: true
            }
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toContain('Minimum STX payment')
    })

    it('should handle community creation authorization error', async () => {
      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      const authError = new Error('You do not have permission to create communities')

      CommunityContractManager.prototype.createCommunity = jest
        .fn()
        .mockRejectedValue(authError)

      const { result } = renderHook(() => useCreateCommunity())

      await act(async () => {
        try {
          await result.current.createCommunity({
            name: 'Unauthorized Community',
            description: 'Test',
            stxPayment: 500,
            settings: {
              allowMemberInvites: true,
              requireApproval: false,
              allowBadgeIssuance: true,
              allowCustomBadges: true
            }
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toContain('permission')
    })

    it('should handle transaction status check errors', async () => {
      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      const statusError = new Error('Transaction not found in any block')

      CommunityContractManager.prototype.validateTransactionStatus = jest
        .fn()
        .mockRejectedValue(statusError)

      const { result } = renderHook(() => useCreateCommunity())

      await expect(
        act(async () => {
          await result.current.checkTransactionStatus('nonexistent_tx')
        })
      ).rejects.toThrow('Transaction not found')
    })

    it('should handle invalid transaction format error', async () => {
      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      const formatError = new Error('Invalid transaction ID format')

      CommunityContractManager.prototype.validateTransactionStatus = jest
        .fn()
        .mockRejectedValue(formatError)

      const { result } = renderHook(() => useCreateCommunity())

      await expect(
        act(async () => {
          await result.current.checkTransactionStatus('invalid_format')
        })
      ).rejects.toThrow('Invalid transaction ID format')
    })

    it('should handle max community limit error', async () => {
      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      const limitError = new Error('Maximum number of communities created by this user reached')

      CommunityContractManager.prototype.createCommunity = jest
        .fn()
        .mockRejectedValue(limitError)

      const { result } = renderHook(() => useCreateCommunity())

      await act(async () => {
        try {
          await result.current.createCommunity({
            name: 'Over Limit Community',
            description: 'Test',
            stxPayment: 500,
            settings: {
              allowMemberInvites: true,
              requireApproval: false,
              allowBadgeIssuance: true,
              allowCustomBadges: true
            }
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toContain('Maximum number')
    })

    it('should handle contract state error', async () => {
      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      const stateError = new Error('Contract is in maintenance mode')

      CommunityContractManager.prototype.createCommunity = jest
        .fn()
        .mockRejectedValue(stateError)

      const { result } = renderHook(() => useCreateCommunity())

      await act(async () => {
        try {
          await result.current.createCommunity({
            name: 'Maintenance Community',
            description: 'Test',
            stxPayment: 500,
            settings: {
              allowMemberInvites: true,
              requireApproval: false,
              allowBadgeIssuance: true,
              allowCustomBadges: true
            }
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toContain('maintenance')
    })
  })

  describe('General Error Handling', () => {
    it('should handle and convert unknown error types', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const unknownError = { status: 500, data: 'Unknown error' }

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockRejectedValue(unknownError)

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'STUNKNOWN',
            templateId: 1,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBeDefined()
    })

    it('should clear previous errors on new requests', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager

      BadgeIssuerManager.prototype.issueBadge = jest
        .fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          txId: 'tx_recovery',
          badgeId: 50
        })

      const { result } = renderHook(() => useIssueBadge())

      // First call - fails
      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'STFIRST',
            templateId: 1,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      expect(result.current.error).toBe('First error')

      // Second call - succeeds (error should be cleared)
      await act(async () => {
        await result.current.issueBadge({
          recipientAddress: 'STSECOND',
          templateId: 2,
          communityId: 1
        })
      })

      expect(result.current.error).toBeNull()
      expect(result.current.success).toBe(true)
    })

    it('should handle rapid successive errors', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      let callCount = 0

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.reject(new Error(`Error ${callCount}`))
        }
        return Promise.resolve({
          txId: `tx_success_${callCount}`,
          badgeId: callCount
        })
      })

      const { result } = renderHook(() => useIssueBadge())

      // Call 1 - error
      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'ST001',
            templateId: 1,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })
      expect(result.current.error).toBe('Error 1')

      // Call 2 - error
      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'ST002',
            templateId: 2,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })
      expect(result.current.error).toBe('Error 2')

      // Call 3 - success
      await act(async () => {
        await result.current.issueBadge({
          recipientAddress: 'ST003',
          templateId: 3,
          communityId: 1
        })
      })
      expect(result.current.error).toBeNull()
      expect(result.current.success).toBe(true)
    })

    it('should maintain error state across re-renders', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const persistentError = new Error('Persistent error state')

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockRejectedValue(persistentError)

      const { result, rerender } = renderHook(() => useIssueBadge())

      await act(async () => {
        try {
          await result.current.issueBadge({
            recipientAddress: 'STPERSIST',
            templateId: 1,
            communityId: 1
          })
        } catch (error) {
          // Expected
        }
      })

      const errorAfterFirstRender = result.current.error
      expect(errorAfterFirstRender).toBe('Persistent error state')

      rerender()

      expect(result.current.error).toBe(errorAfterFirstRender)
    })
  })
})
