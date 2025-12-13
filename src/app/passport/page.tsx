'use client'

import { useState, useEffect } from 'react'
import BadgeGrid from '@/components/BadgeGrid'
import { Share2, Download, Eye, EyeOff } from 'lucide-react'

// Mock data - in real app, this would come from blockchain
const mockBadges = [
  {
    id: 1,
    name: 'Python Beginner',
    description: 'Completed basic Python programming course',
    community: 'Open Code Guild',
    level: 1,
    category: 'skill',
    timestamp: 1703980800,
    icon: '🐍'
  },
  {
    id: 2,
    name: 'Event Participant',
    description: 'Attended Web3 Developer Conference 2024',
    community: 'Web3 Events',
    level: 2,
    category: 'participation',
    timestamp: 1703894400,
    icon: '🎉'
  },
  {
    id: 3,
    name: 'Community Contributor',
    description: 'Made 10+ contributions to open source projects',
    community: 'DevDAO',
    level: 3,
    category: 'contribution',
    timestamp: 1703808000,
    icon: '🛠️'
  }
]

export default function PassportPage() {
  const [badges, setBadges] = useState(mockBadges)
  const [isPublic, setIsPublic] = useState(true)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    setShareUrl(`${window.location.origin}/public/passport/user123`)
  }, [])

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'My PassportX Achievement Passport',
        text: 'Check out my achievements on PassportX!',
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert('Share URL copied to clipboard!')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Passport</h1>
            <p className="text-gray-600">
              {badges.length} achievement{badges.length !== 1 ? 's' : ''} earned across {new Set(badges.map(b => b.community)).size} communities
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isPublic 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{isPublic ? 'Public' : 'Private'}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 btn-primary"
              disabled={!isPublic}
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            
            <button className="flex items-center space-x-2 btn-secondary">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {isPublic && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>Public URL:</strong> {shareUrl}
            </p>
          </div>
        )}
      </div>

      <BadgeGrid badges={badges} />
    </div>
  )
}