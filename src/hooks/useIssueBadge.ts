import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  BadgeIssuerManager,
  BadgeIssuanceParams,
  BadgeIssuerResponse
} from '@/lib/contracts/badgeContractUtils'

interface IssueBadgeOptions {
  recipientAddress: string
  templateId: number
  communityId: number
  recipientName?: string
  recipientEmail?: string
}

interface IssueBadgeState {
  isLoading: boolean
  error: string | null
  success: boolean
  txId: string | null
  badgeId: number | null
}

export const useIssueBadge = () => {
  const { user, userSession } = useAuth()
  const [state, setState] = useState<IssueBadgeState>({
    isLoading: false,
    error: null,
    success: false,
    txId: null,
    badgeId: null
  })

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false,
      txId: null,
      badgeId: null
    })
  }, [])

  const issueBadge = useCallback(
    async (options: IssueBadgeOptions) => {
      if (!user || !userSession.isUserSignedIn()) {
        setState(prev => ({
          ...prev,
          error: 'You must be signed in to issue badges'
        }))
        throw new Error('User not authenticated')
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }))

      try {
        const contractAddress = process.env.NEXT_PUBLIC_BADGE_ISSUER_ADDRESS ||
          (process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet'
            ? process.env.NEXT_PUBLIC_MAINNET_BADGE_ISSUER_ADDRESS
            : process.env.NEXT_PUBLIC_TESTNET_BADGE_ISSUER_ADDRESS)

        if (!contractAddress) {
          throw new Error('Badge issuer contract address not configured')
        }

        const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

        const manager = new BadgeIssuerManager(
          contractAddress,
          userSession,
          network
        )

        const issuanceParams: BadgeIssuanceParams = {
          recipientAddress: options.recipientAddress,
          templateId: options.templateId,
          communityId: options.communityId,
          network: network as 'testnet' | 'mainnet'
        }

        const result = await manager.issueBadge(issuanceParams)

        setState(prev => ({
          ...prev,
          isLoading: false,
          success: true,
          txId: result.txId,
          badgeId: result.badgeId || null
        }))

        await registerBadgeIssuance({
          txId: result.txId,
          recipientAddress: options.recipientAddress,
          templateId: options.templateId,
          communityId: options.communityId,
          issuerAddress: user.stacksAddress,
          recipientName: options.recipientName,
          recipientEmail: options.recipientEmail,
          network,
          createdAt: new Date().toISOString()
        })

        return result
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to issue badge'
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }))

        throw error
      }
    },
    [user, userSession]
  )

  const revokeBadge = useCallback(
    async (badgeId: number) => {
      if (!user || !userSession.isUserSignedIn()) {
        setState(prev => ({
          ...prev,
          error: 'You must be signed in to revoke badges'
        }))
        throw new Error('User not authenticated')
      }

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }))

      try {
        const contractAddress = process.env.NEXT_PUBLIC_BADGE_ISSUER_ADDRESS ||
          (process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet'
            ? process.env.NEXT_PUBLIC_MAINNET_BADGE_ISSUER_ADDRESS
            : process.env.NEXT_PUBLIC_TESTNET_BADGE_ISSUER_ADDRESS)

        if (!contractAddress) {
          throw new Error('Badge issuer contract address not configured')
        }

        const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

        const manager = new BadgeIssuerManager(
          contractAddress,
          userSession,
          network
        )

        const result = await manager.revokeBadge(badgeId)

        setState(prev => ({
          ...prev,
          isLoading: false,
          success: true,
          txId: result.txId,
          badgeId: result.badgeId || null
        }))

        return result
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to revoke badge'
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }))

        throw error
      }
    },
    [user, userSession]
  )

  return {
    issueBadge,
    revokeBadge,
    resetState,
    isLoading: state.isLoading,
    error: state.error,
    success: state.success,
    txId: state.txId,
    badgeId: state.badgeId
  }
}

async function registerBadgeIssuance(payload: {
  txId: string
  recipientAddress: string
  templateId: number
  communityId: number
  issuerAddress: string
  recipientName?: string
  recipientEmail?: string
  network: 'testnet' | 'mainnet'
  createdAt: string
}) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001'

  const response = await fetch(`${backendUrl}/api/badges/issuance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BACKEND_API_KEY || ''}`
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to register badge issuance')
  }

  return response.json()
}
