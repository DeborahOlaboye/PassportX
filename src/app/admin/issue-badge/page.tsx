'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BadgeIssuanceForm from '@/components/forms/BadgeIssuanceForm'
import { useIssueBadge } from '@/hooks/useIssueBadge'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import Link from 'next/link'

interface BadgeTemplate {
  id: number
  name: string
  description: string
  category: string
  level: number
  icon?: string
  community: string
}

interface BadgeIssuanceFormData {
  recipientAddress: string
  recipientName: string
  recipientEmail: string
  templateId: number
  communityId: number
}

type PageState = 'form' | 'loading' | 'success' | 'error'

export default function IssueBadgePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { issueBadge, isLoading, error, success, txId } = useIssueBadge()
  const [pageState, setPageState] = useState<PageState>('form')
  const [localError, setLocalError] = useState<string>('')
  const [templates, setTemplates] = useState<BadgeTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [recipientInfo, setRecipientInfo] = useState({ name: '', address: '' })

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        if (!user) return
        
        setTemplatesLoading(true)
        const response = await fetch(
          `/api/badges/templates?issuer=${user.stacksAddress}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BACKEND_API_KEY || ''}`
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch badge templates')
        }

        const data = await response.json()
        setTemplates(Array.isArray(data) ? data : data.templates || [])
      } catch (err) {
        console.error('Error fetching templates:', err)
        setLocalError('Failed to load badge templates')
      } finally {
        setTemplatesLoading(false)
      }
    }

    fetchTemplates()
  }, [user])

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

  const handleSubmit = async (data: BadgeIssuanceFormData) => {
    try {
      setLocalError('')
      setRecipientInfo({ name: data.recipientName, address: data.recipientAddress })

      await issueBadge({
        recipientAddress: data.recipientAddress,
        templateId: data.templateId,
        communityId: data.communityId,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail
      })
    } catch (err) {
      console.error('Badge issuance error:', err)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        {pageState === 'form' && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Issue Badge</h1>
              <p className="text-gray-600">
                Award badges to community members from your badge templates
              </p>
            </div>

            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : templates.length === 0 ? (
              <div className="card text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Badge Templates Found
                </h3>
                <p className="text-gray-600 mb-4">
                  You need to create badge templates before issuing badges.
                </p>
                <Link
                  href="/admin/create-badge-template"
                  className="btn-primary inline-block"
                >
                  Create Badge Template
                </Link>
              </div>
            ) : (
              <BadgeIssuanceForm
                onSubmit={handleSubmit}
                templates={templates}
                isLoading={isLoading}
                error={localError}
              />
            )}
          </>
        )}

        {pageState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader className="w-12 h-12 animate-spin text-primary-600 mb-4" />
            <p className="text-lg font-medium text-gray-900">
              Issuing badge to {recipientInfo.name}...
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Please confirm the transaction in your wallet
            </p>
          </div>
        )}

        {pageState === 'success' && (
          <div className="card border-green-200 bg-green-50 text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Badge Issued Successfully!
            </h2>
            <p className="text-gray-700 mb-6">
              The badge has been issued to {recipientInfo.name}
            </p>
            {txId && (
              <p className="text-sm text-gray-600 mb-6">
                Transaction ID: <span className="font-mono">{txId}</span>
              </p>
            )}
            <p className="text-sm text-gray-600">
              Redirecting to admin dashboard...
            </p>
          </div>
        )}

        {pageState === 'error' && (
          <div className="card border-red-200 bg-red-50 text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Failed to Issue Badge
            </h2>
            <p className="text-gray-700 mb-6">
              {localError || 'An error occurred while issuing the badge'}
            </p>
            <button
              onClick={() => setPageState('form')}
              className="btn-primary inline-block"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
