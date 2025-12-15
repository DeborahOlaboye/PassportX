'use client'

import { useState, useEffect } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

interface FilterOption {
  levels: number[]
  categories: string[]
  communities: { _id: string; name: string; count: number }[]
}

interface ActiveFilters {
  levels: number[]
  categories: string[]
  community?: string
  startDate?: string
  endDate?: string
}

interface FilterPanelProps {
  onFilterChange: (filters: ActiveFilters) => void
  className?: string
}

export default function FilterPanel({ onFilterChange, className = '' }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOption | null>(null)
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    levels: [],
    categories: [],
  })
  const [expandedSections, setExpandedSections] = useState({
    level: true,
    category: true,
    community: false,
    date: false,
  })

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    onFilterChange(activeFilters)
  }, [activeFilters])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/badges/filters')
      const data = await response.json()

      if (data.success) {
        setFilterOptions(data.data)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleLevelToggle = (level: number) => {
    setActiveFilters((prev) => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter((l) => l !== level)
        : [...prev.levels, level],
    }))
  }

  const handleCategoryToggle = (category: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handleCommunityChange = (communityId: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      community: communityId === prev.community ? undefined : communityId,
    }))
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }))
  }

  const clearFilters = () => {
    setActiveFilters({
      levels: [],
      categories: [],
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    count += activeFilters.levels.length
    count += activeFilters.categories.length
    if (activeFilters.community) count++
    if (activeFilters.startDate || activeFilters.endDate) count++
    return count
  }

  const getLevelLabel = (level: number) => {
    const labels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master']
    return labels[level - 1] || `Level ${level}`
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <div className={`${className}`}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-5 h-5" />
        <span className="font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute z-20 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* Level Filter */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('level')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">Level</span>
                {expandedSections.level ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {expandedSections.level && (
                <div className="px-4 pb-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeFilters.levels.includes(level)}
                        onChange={() => handleLevelToggle(level)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{getLevelLabel(level)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('category')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">Category</span>
                {expandedSections.category ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {expandedSections.category && filterOptions && (
                <div className="px-4 pb-4 space-y-2">
                  {filterOptions.categories.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeFilters.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Community Filter */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('community')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">Community</span>
                {expandedSections.community ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {expandedSections.community && filterOptions && (
                <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
                  {filterOptions.communities.map((community) => (
                    <label key={community._id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="community"
                        checked={activeFilters.community === community._id}
                        onChange={() => handleCommunityChange(community._id)}
                        className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700 flex-1">{community.name}</span>
                      <span className="text-xs text-gray-500">({community.count})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div>
              <button
                onClick={() => toggleSection('date')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">Date Range</span>
                {expandedSections.date ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {expandedSections.date && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">From</label>
                    <input
                      type="date"
                      value={activeFilters.startDate || ''}
                      onChange={(e) => handleDateChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">To</label>
                    <input
                      type="date"
                      value={activeFilters.endDate || ''}
                      onChange={(e) => handleDateChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
