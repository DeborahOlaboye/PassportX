import { Award, Calendar, Tag } from 'lucide-react'

interface Badge {
  id: number
  name: string
  description: string
  community: string
  level: number
  category: string
  timestamp: number
  icon?: string
}

interface BadgeCardProps {
  badge: Badge
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800'
      case 2: return 'bg-blue-100 text-blue-800'
      case 3: return 'bg-purple-100 text-purple-800'
      case 4: return 'bg-orange-100 text-orange-800'
      case 5: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            {badge.icon ? (
              <span className="text-2xl">{badge.icon}</span>
            ) : (
              <Award className="w-6 h-6 text-primary-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{badge.name}</h3>
            <p className="text-sm text-gray-600">{badge.community}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(badge.level)}`}>
          Level {badge.level}
        </span>
      </div>
      
      <p className="text-gray-700 mb-4">{badge.description}</p>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <Tag className="w-4 h-4" />
          <span>{badge.category}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(badge.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}