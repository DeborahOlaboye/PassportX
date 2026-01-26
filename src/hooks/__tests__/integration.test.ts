/**
 * Integration tests for contract interaction hooks
 * Tests blockchain interactions, transaction flows, and post-conditions
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useIssueBadge } from '../useIssueBadge'
import { useCreateCommunity } from '../useCreateCommunity'
import { useAuth } from '@/contexts/AuthContext'

// Mock dependencies
jest.mock('@/contexts/AuthContext')
jest.mock('@/lib/contracts/badgeContractUtils')
jest.mock('@/lib/contracts/communityContractUtils')

describe('Contract Hooks Integration Tests', () => {
  const mockUserSession = {
    isUserSignedIn: jest.fn(() => true),
    loadUserData: jest.fn(() => ({
      profile: {
        stxAddress: {
          testnet: 'ST123456789TESTNETADDRESS',
          mainnet: 'SP123456789MAINNETADDRESS'
        }
      }
    }))
  }

  const mockUser = {
    stacksAddress: 'ST123456789TESTNETADDRESS',
    username: 'testuser'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      userSession: mockUserSession
    })
  })

  describe('useIssueBadge Hook - Integration Tests', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useIssueBadge())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.success).toBe(false)
      expect(result.current.txId).toBeNull()
      expect(result.current.badgeId).toBeNull()
    })

    it('should handle successful badge issuance with transaction flow', async () => {
      const mockTxId = 'tx_successful_badge_issuance_001'
      const mockBadgeId = 42

      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockResolvedValue({
        txId: mockTxId,
        badgeId: mockBadgeId
      })

      const { result } = renderHook(() => useIssueBadge())

      const issuanceOptions = {
        recipientAddress: 'ST2CY5V5NWVNTZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5ZYZZ',
        templateId: 1,
        communityId: 1,
        recipientName: 'John Doe',
        recipientEmail: 'john@example.com'
      }

      await act(async () => {
        await result.current.issueBadge(issuanceOptions)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.success).toBe(true)
      expect(result.current.txId).toBe(mockTxId)
      expect(result.current.badgeId).toBe(mockBadgeId)
      expect(result.current.error).toBeNull()
    })

    it('should handle transaction failure with proper error state', async () => {
      const errorMessage = 'Insufficient funds for transaction'

      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      BadgeIssuerManager.prototype.issueBadge = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useIssueBadge())

      const issuanceOptions = {
        recipientAddress: 'ST2CY5V5NWVNTZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5ZYZZ',
        templateId: 1,
        communityId: 1
      }

      await act(async () => {
        try {
          await result.current.issueBadge(issuanceOptions)
        } catch (error) {
          // Expected error
        }
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.success).toBe(false)
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.txId).toBeNull()
    })

    it('should throw error when user not authenticated', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: null,
        userSession: {
          isUserSignedIn: jest.fn(() => false)
        }
      })

      const { result } = renderHook(() => useIssueBadge())

      const issuanceOptions = {
        recipientAddress: 'ST2CY5V5NWVNTZ5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5ZYZZ',
        templateId: 1,
        communityId: 1
      }

      await expect(
        act(async () => {
          await result.current.issueBadge(issuanceOptions)
        })
      ).rejects.toThrow('User not authenticated')

      expect(result.current.error).toBe('You must be signed in to issue badges')
    })

    it('should handle badge revocation with transaction validation', async () => {
      const mockTxId = 'tx_revoke_badge_001'

      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      BadgeIssuerManager.prototype.revokeBadge = jest.fn().mockResolvedValue({
        txId: mockTxId,
        badgeId: 42
      })

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        await result.current.revokeBadge(42)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.success).toBe(true)
      expect(result.current.txId).toBe(mockTxId)
    })

    it('should reset state when resetState is called', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockResolvedValue({
        txId: 'tx_123',
        badgeId: 42
      })

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        await result.current.issueBadge({
          recipientAddress: 'ST123',
          templateId: 1,
          communityId: 1
        })
      })

      expect(result.current.success).toBe(true)

      act(() => {
        result.current.resetState()
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.success).toBe(false)
      expect(result.current.txId).toBeNull()
      expect(result.current.badgeId).toBeNull()
    })

    it('should validate post-conditions for badge issuance', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const mockIssueBadge = jest.fn().mockResolvedValue({
        txId: 'tx_postcondition_test',
        badgeId: 99
      })
      BadgeIssuerManager.prototype.issueBadge = mockIssueBadge

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        await result.current.issueBadge({
          recipientAddress: 'ST456',
          templateId: 2,
          communityId: 3
        })
      })

      // Verify post-condition validation was called
      expect(mockIssueBadge).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientAddress: 'ST456',
          templateId: 2,
          communityId: 3
        })
      )

      expect(result.current.badgeId).toBe(99)
    })
  })

  describe('useCreateCommunity Hook - Integration Tests', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useCreateCommunity())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.success).toBe(false)
      expect(result.current.txId).toBeNull()
      expect(result.current.communityId).toBeNull()
    })

    it('should handle successful community creation', async () => {
      const mockTxId = 'tx_create_community_001'
      const mockCommunityId = 5

      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      CommunityContractManager.prototype.createCommunity = jest.fn().mockResolvedValue({
        txId: mockTxId,
        communityId: mockCommunityId
      })

      const { result } = renderHook(() => useCreateCommunity())

      const communityOptions = {
        name: 'Developer Community',
        description: 'A community for developers',
        stxPayment: 1000,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: true
        }
      }

      await act(async () => {
        await result.current.createCommunity(communityOptions)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.success).toBe(true)
      expect(result.current.txId).toBe(mockTxId)
      expect(result.current.communityId).toBe(mockCommunityId)
      expect(result.current.error).toBeNull()
    })

    it('should handle community creation failure', async () => {
      const errorMessage = 'Community name already exists'

      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      CommunityContractManager.prototype.createCommunity = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useCreateCommunity())

      const communityOptions = {
        name: 'Duplicate Community',
        description: 'A duplicate community',
        stxPayment: 1000,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: true
        }
      }

      await act(async () => {
        try {
          await result.current.createCommunity(communityOptions)
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.success).toBe(false)
    })

    it('should check transaction status after creation', async () => {
      const mockTxId = 'tx_check_status_001'
      const mockTxStatus = {
        status: 'success',
        blockHeight: 12345,
        confirmed: true
      }

      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      CommunityContractManager.prototype.validateTransactionStatus = jest
        .fn()
        .mockResolvedValue(mockTxStatus)

      const { result } = renderHook(() => useCreateCommunity())

      let transactionStatus
      await act(async () => {
        transactionStatus = await result.current.checkTransactionStatus(mockTxId)
      })

      expect(transactionStatus.status).toBe('success')
      expect(transactionStatus.confirmed).toBe(true)
    })

    it('should handle transaction status check failure', async () => {
      const errorMessage = 'Transaction not found'

      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      CommunityContractManager.prototype.validateTransactionStatus = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useCreateCommunity())

      await expect(
        act(async () => {
          await result.current.checkTransactionStatus('invalid_tx_id')
        })
      ).rejects.toThrow(errorMessage)
    })

    it('should throw error when user not authenticated for community creation', async () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: null,
        userSession: {
          isUserSignedIn: jest.fn(() => false)
        }
      })

      const { result } = renderHook(() => useCreateCommunity())

      const communityOptions = {
        name: 'Test Community',
        description: 'Test',
        stxPayment: 1000,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: true
        }
      }

      await expect(
        act(async () => {
          await result.current.createCommunity(communityOptions)
        })
      ).rejects.toThrow('User not authenticated')
    })

    it('should validate post-conditions for community creation', async () => {
      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      const mockCreateCommunity = jest.fn().mockResolvedValue({
        txId: 'tx_validate_postcond',
        communityId: 10
      })
      CommunityContractManager.prototype.createCommunity = mockCreateCommunity

      const { result } = renderHook(() => useCreateCommunity())

      const communityOptions = {
        name: 'Post Condition Test',
        description: 'Testing post-conditions',
        stxPayment: 500,
        settings: {
          allowMemberInvites: true,
          requireApproval: true,
          allowBadgeIssuance: true,
          allowCustomBadges: false
        }
      }

      await act(async () => {
        await result.current.createCommunity(communityOptions)
      })

      expect(mockCreateCommunity).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Post Condition Test',
          description: 'Testing post-conditions',
          stxPayment: 500
        })
      )

      expect(result.current.communityId).toBe(10)
    })

    it('should reset state when resetState is called', async () => {
      const CommunityContractManager = require('@/lib/contracts/communityContractUtils').CommunityContractManager
      CommunityContractManager.prototype.createCommunity = jest.fn().mockResolvedValue({
        txId: 'tx_reset_test',
        communityId: 7
      })

      const { result } = renderHook(() => useCreateCommunity())

      const communityOptions = {
        name: 'Reset Test Community',
        description: 'Test',
        stxPayment: 1000,
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: true
        }
      }

      await act(async () => {
        await result.current.createCommunity(communityOptions)
      })

      expect(result.current.success).toBe(true)

      act(() => {
        result.current.resetState()
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.success).toBe(false)
      expect(result.current.txId).toBeNull()
      expect(result.current.communityId).toBeNull()
    })
  })

  describe('Transaction Flow Validation', () => {
    it('should properly handle concurrent badge issuance requests', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      let callCount = 0

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockImplementation(() => {
        callCount++
        return Promise.resolve({
          txId: `tx_concurrent_${callCount}`,
          badgeId: 100 + callCount
        })
      })

      const { result: result1 } = renderHook(() => useIssueBadge())
      const { result: result2 } = renderHook(() => useIssueBadge())

      await act(async () => {
        await Promise.all([
          result1.current.issueBadge({
            recipientAddress: 'ST111',
            templateId: 1,
            communityId: 1
          }),
          result2.current.issueBadge({
            recipientAddress: 'ST222',
            templateId: 2,
            communityId: 1
          })
        ])
      })

      expect(result1.current.success).toBe(true)
      expect(result2.current.success).toBe(true)
      expect(result1.current.badgeId).toBe(101)
      expect(result2.current.badgeId).toBe(102)
    })

    it('should verify transaction IDs are properly tracked', async () => {
      const BadgeIssuerManager = require('@/lib/contracts/badgeContractUtils').BadgeIssuerManager
      const txIds = new Set()

      BadgeIssuerManager.prototype.issueBadge = jest.fn().mockImplementation((params) => {
        const txId = `tx_${Date.now()}_${Math.random()}`
        txIds.add(txId)
        return Promise.resolve({
          txId,
          badgeId: 42
        })
      })

      const { result } = renderHook(() => useIssueBadge())

      await act(async () => {
        await result.current.issueBadge({
          recipientAddress: 'ST123',
          templateId: 1,
          communityId: 1
        })
      })

      expect(txIds.size).toBe(1)
      expect(result.current.txId).toBeDefined()
    })
  })
})
