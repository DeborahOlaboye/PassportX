import { Metadata } from 'next'
import BadgeGrid from '@/components/BadgeGrid'
import { Share2, ExternalLink, Calendar } from 'lucide-react'

// Mock user data - in real app, this would be fetched based on userId
const mockUserData = {
  id: 'user123',
  name: 'Alex Developer',
  bio: 'Full-stack developer passionate about Web3 and blockchain technology',
  joinDate: '2023-06-15',
  badges: [
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
    },
    {
      id: 4,
      name: 'JavaScript Expert',
      description: 'Demonstrated advanced JavaScript skills',
      community: 'Open Code Guild',
      level: 4,
      category: 'skill',
      timestamp: 1703721600,
      icon: '⚡'
    }
  ]
}

export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  // In real app, fetch user data here
  const user = mockUserData
  
  return {
    title: `${user.name}'s PassportX Achievement Passport`,
    description: `View ${user.name}'s achievements and badges earned across various communities on PassportX`,
    openGraph: {
      title: `${user.name}'s Achievement Passport`,
      description: `${user.badges.length} achievements earned across ${new Set(user.badges.map(b => b.community)).size} communities`,
      images: ['/og-passport.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${user.name}'s Achievement Passport`,
      description: `${user.badges.length} achievements on PassportX`,
    }
  }
}

export default function PublicPassportPage({ params }: { params: { userId: string } }) {
  const user = mockUserData // In real app, fetch based on params.userId
  const communities = new Set(user.badges.map(badge => badge.community))
  
  const handleShare = async () => {
    const shareData = {
      title: `${user.name}'s PassportX Achievement Passport`,
      text: `Check out ${user.name}'s achievements on PassportX!`,
      url: window.location.href,
    }

    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h1>
                <p className="text-gray-600 mb-2">{user.bio}</p>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(user.joinDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">{user.badges.length}</div>
              <div className="text-gray-600">Total Badges</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">{communities.size}</div>
              <div className="text-gray-600">Communities</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {Math.max(...user.badges.map(b => b.level))}
              </div>
              <div className="text-gray-600">Highest Level</div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Achievement Badges</h2>
            <a
              href="/"
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <span>Create your own passport</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          <BadgeGrid badges={user.badges} />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 py-6 border-t border-gray-200">
          <p className="text-gray-600 mb-2">
            Powered by <span className="font-semibold">PassportX</span>
          </p>
          <p className="text-sm text-gray-500">
            A portable, on-chain Achievement Passport built on Stacks
          </p>
        </div>
      </div>
    </div>
  )
}