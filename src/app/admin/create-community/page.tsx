'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CommunityCreationForm from '@/components/forms/CommunityCreationForm'
import { useCreateCommunity } from '@/hooks/useCreateCommunity'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import Link from 'next/link'

interface CreateCommunityFormData {
  name: string
  description: string
  about: string
  website: string
  primaryColor: string
  secondaryColor: string
  stxPayment: number
  allowMemberInvites: boolean
  requireApproval: boolean
  allowBadgeIssuance: boolean
  allowCustomBadges: boolean
  tags: string
}

type PageState = 'form' | 'loading' | 'success' | 'pending' | 'error'

export default function CreateCommunityPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { createCommunity, isLoading, error, success, txId } = useCreateCommunity()
  const [pageState, setPageState] = useState<PageState>('form')
  const [localError, setLocalError] = useState<string>('')
  const [communityName, setCommunityName] = useState<string>('')

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isLoading) {
      setPageState('loading')
    } else if (success) {
      setPageState('success')
      setTimeout(() => {
        router.push('/admin')
      }, 3000)
    } else if (error) {
      setPageState('error')
      setLocalError(error)
    }
  }, [isLoading, success, error, router])

  const handleSubmit = async (data: CreateCommunityFormData) => {
    try {
      setLocalError('')
      setCommunityName(data.name)

      const tags = data.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      await createCommunity({
        name: data.name,
        description: data.description,
        about: data.about,
        website: data.website,
        stxPayment: data.stxPayment,
        theme: {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor
        },
        settings: {
          allowMemberInvites: data.allowMemberInvites,
          requireApproval: data.requireApproval,
          allowBadgeIssuance: data.allowBadgeIssuance,
          allowCustomBadges: data.allowCustomBadges
        },
        tags
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setLocalError(errorMessage)
      setPageState('error')
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Community Created!</h1>
          <p className="text-gray-600 mb-4">
            Your community "{communityName}" has been successfully created on the blockchain.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Transaction ID: {txId && <code className="text-xs bg-gray-100 px-2 py-1 rounded">{txId.slice(0, 16)}...</code>}
          </p>
          <p className="text-gray-600 mb-6">
            Redirecting to dashboard...
          </p>
          <Link href="/admin" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (pageState === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-primary-500 rounded-full"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Community...</h3>
          <p className="text-gray-600 mb-4">Please confirm the transaction in your wallet</p>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This may take a few moments. Please don't close this page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (pageState === 'pending') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for Confirmation</h3>
          <p className="text-gray-600">
            Your transaction is being processed by the blockchain network...
          </p>
          {txId && (
            <p className="text-xs text-gray-500 mt-4">
              <a
                href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                View on Explorer
              </a>
            </p>
          )}
        </div>
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Community</h1>
          <p className="text-gray-600">
            Build your community and issue badges to members
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-8">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Creating Community</h3>
                <p className="text-red-800 text-sm">{localError}</p>
                <button
                  onClick={() => {
                    setPageState('form')
                    setLocalError('')
                  }}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>

          <CommunityCreationForm
            onSubmit={handleSubmit}
            isLoading={false}
            error=""
          />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/admin"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Community</h1>
        <p className="text-gray-600">
          Build your community and issue badges to members
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <CommunityCreationForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={localError}
        />
      </div>
    </div>
  )
}
