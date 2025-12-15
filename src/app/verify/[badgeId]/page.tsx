'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface VerificationData {
  badgeId: string
  verified: boolean
  active: boolean
  templateName?: string
  communityName?: string
  level: number
  category: string
  issuedAt: string
  verifiedAt: string
}

export default function VerifyBadgePage() {
  const params = useParams()
  const badgeId = params?.badgeId as string

  const [verification, setVerification] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!badgeId) return

    const fetchVerification = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/verify/public/${badgeId}`)
        const data = await response.json()

        if (data.success) {
          setVerification(data.data)
        } else {
          setError(data.error || 'Badge not found')
        }
      } catch (err) {
        setError('Failed to verify badge')
      } finally {
        setLoading(false)
      }
    }

    fetchVerification()
  }, [badgeId])

  const getLevelColor = (level: number) => {
    const colors = ['green', 'blue', 'purple', 'orange', 'red']
    return colors[level - 1] || 'gray'
  }

  const getLevelLabel = (level: number) => {
    const labels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master']
    return labels[level - 1] || 'Unknown'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying badge...</p>
        </div>
      </div>
    )
  }

  if (error || !verification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600">{error || 'Badge not found'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r from-${getLevelColor(verification.level)}-500 to-${getLevelColor(verification.level)}-600 p-8 text-white`}>
            <div className="flex items-center justify-center mb-4">
              {verification.verified && verification.active ? (
                <div className="bg-white rounded-full p-3">
                  <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="bg-white rounded-full p-3">
                  <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-center">Badge Verification</h1>
            <p className="text-center mt-2 opacity-90">
              {verification.verified && verification.active ? 'Verified & Active' : 'Verification Status'}
            </p>
          </div>

          {/* Badge Details */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {verification.templateName || 'Badge'}
              </h2>
              <p className="text-gray-600">
                Issued by {verification.communityName || 'Unknown Community'}
              </p>
            </div>

            {/* Verification Status */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="font-semibold text-gray-900">
                  {verification.verified && verification.active ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : !verification.active ? (
                    <span className="text-red-600">Revoked</span>
                  ) : (
                    <span className="text-yellow-600">Unverified</span>
                  )}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Level</p>
                <p className={`font-semibold text-${getLevelColor(verification.level)}-600`}>
                  {getLevelLabel(verification.level)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Category</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {verification.category}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Issued</p>
                <p className="font-semibold text-gray-900">
                  {new Date(verification.issuedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Badge ID */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-1">Badge ID</p>
              <p className="font-mono text-xs text-gray-800 break-all">
                {verification.badgeId}
              </p>
            </div>

            {/* Verification Timestamp */}
            <div className="text-center text-sm text-gray-500">
              Verified on {new Date(verification.verifiedAt).toLocaleString()}
            </div>

            {/* Share Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert('Verification link copied to clipboard!')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Share Verification
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Print Certificate
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>This badge is verified on the PassportX platform</p>
          <p className="mt-1">Powered by Stacks blockchain</p>
        </div>
      </div>
    </div>
  )
}
