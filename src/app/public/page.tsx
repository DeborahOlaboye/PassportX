import Link from 'next/link'
import { Search, TrendingUp, Users, Award } from 'lucide-react'

// Mock data for featured passports
const featuredPassports = [
  {
    userId: 'user123',
    name: 'Alex Developer',
    badgeCount: 4,
    communities: 3,
    recentBadge: 'JavaScript Expert',
    avatar: 'AD'
  },
  {
    userId: 'user456',
    name: 'Sarah Designer',
    badgeCount: 7,
    communities: 2,
    recentBadge: 'UI/UX Master',
    avatar: 'SD'
  },
  {
    userId: 'user789',
    name: 'Mike Blockchain',
    badgeCount: 12,
    communities: 5,
    recentBadge: 'Smart Contract Auditor',
    avatar: 'MB'
  }
]

const trendingCommunities = [
  { name: 'Open Code Guild', members: 1250, badges: 15 },
  { name: 'Web3 Events', members: 890, badges: 8 },
  { name: 'DevDAO', members: 2100, badges: 22 },
  { name: 'Design Collective', members: 650, badges: 12 }
]

export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Explore PassportX
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover amazing achievements from our community members and find inspiration for your own journey
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search passports, communities, or badges..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Featured Passports */}
        <div className="lg:col-span-2">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Featured Passports</h2>
          </div>
          
          <div className="space-y-4">
            {featuredPassports.map(passport => (
              <Link
                key={passport.userId}
                href={`/public/passport/${passport.userId}`}
                className="block card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {passport.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {passport.name}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Latest: {passport.recentBadge}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Award className="w-4 h-4" />
                        <span>{passport.badgeCount} badges</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{passport.communities} communities</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <button className="btn-secondary">
              Load More Passports
            </button>
          </div>
        </div>

        {/* Trending Communities */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Trending Communities</h2>
          
          <div className="space-y-4">
            {trendingCommunities.map((community, index) => (
              <div key={community.name} className="card">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                    #{index + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900">{community.name}</h3>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Members</span>
                    <span className="font-medium">{community.members.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Badge Types</span>
                    <span className="font-medium">{community.badges}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Link href="/admin" className="w-full btn-primary text-center block">
              Create Your Community
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}