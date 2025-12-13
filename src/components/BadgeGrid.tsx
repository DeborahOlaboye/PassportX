'use client'

import { useState, useEffect } from 'react'
import BadgeCard from './BadgeCard'
import { Filter, Search } from 'lucide-react'

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

interface BadgeGridProps {
  badges: Badge[]
}

export default function BadgeGrid({ badges }: BadgeGridProps) {
  const [filteredBadges, setFilteredBadges] = useState(badges)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')

  const categories = ['all', ...Array.from(new Set(badges.map(badge => badge.category)))]
  const levels = ['all', ...Array.from(new Set(badges.map(badge => badge.level))).sort()]

  useEffect(() => {
    let filtered = badges

    if (searchTerm) {
      filtered = filtered.filter(badge =>
        badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.community.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(badge => badge.category === selectedCategory)
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(badge => badge.level === parseInt(selectedLevel))
    }

    setFilteredBadges(filtered)
  }, [badges, searchTerm, selectedCategory, selectedLevel])

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search badges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            {levels.map(level => (
              <option key={level} value={level}>
                {level === 'all' ? 'All Levels' : `Level ${level}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredBadges.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBadges.map(badge => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}
    </div>
  )
}