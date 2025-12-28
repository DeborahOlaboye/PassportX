'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BadgeForm from '@/components/forms/BadgeForm'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

// Mock communities data
const mockCommunities = [
  { id: 'open-code-guild', name: 'Open Code Guild' },
  { id: 'web3-events', name: 'Web3 Events' },
  { id: 'devdao', name: 'DevDAO' }
]

interface BadgeFormData {
  name: string
  description: string
  category: string
  level: number
  icon: string
  community: string
  requirements: string
}

export default function CreateBadgePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (data: BadgeFormData) => {
    setIsSubmitting(true)
    
    try {
      // In a real app, this would call the smart contract
      console.log('Creating badge template:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSuccess(true)
      
      // Redirect after success
      setTimeout(() => {
        router.push('/admin')
      }, 2000)
      
    } catch (error) {
      console.error('Error creating badge:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Badge Created!</h1>
          <p className="text-gray-600 mb-6">
            Your badge template has been successfully created and is ready to be issued.
          </p>
          <Link href="/admin" className="btn-primary">
            Back to Dashboard
          </Link>
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
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Badge Template</h1>
        <p className="text-gray-600">
          Design a new badge that can be issued to community members
        </p>
      </div>

      {isSubmitting ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-primary-500 rounded-full"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Creating Badge Template...</h3>
          <p className="text-gray-600">This may take a few moments</p>
        </div>
      ) : (
        <BadgeForm onSubmit={handleSubmit} communities={mockCommunities} />
      )}
    </div>
  )
}