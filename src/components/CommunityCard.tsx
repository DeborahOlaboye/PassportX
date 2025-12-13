import Link from 'next/link'
import { Users, Award, Settings } from 'lucide-react'

interface Community {
  id: string
  name: string
  description: string
  memberCount: number
  badgeCount: number
  theme: {
    primaryColor: string
    logo?: string
  }
}

interface CommunityCardProps {
  community: Community
}

export default function CommunityCard({ community }: CommunityCardProps) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: community.theme.primaryColor }}
          >
            {community.theme.logo ? (
              <img src={community.theme.logo} alt={community.name} className="w-8 h-8 rounded-full" />
            ) : (
              community.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{community.name}</h3>
            <p className="text-sm text-gray-600">{community.description}</p>
          </div>
        </div>
        
        <Link 
          href={`/admin/community/${community.id}`}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Members</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{community.memberCount}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-sm">Badges</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{community.badgeCount}</p>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Link 
          href={`/admin/community/${community.id}/badges`}
          className="flex-1 text-center py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
        >
          Manage Badges
        </Link>
        <Link 
          href={`/admin/community/${community.id}/members`}
          className="flex-1 text-center py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          View Members
        </Link>
      </div>
    </div>
  )
}