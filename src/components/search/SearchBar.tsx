'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchSuggestion {
  id: string
  name: string
  description: string
  category: string
}

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  showSuggestions?: boolean
  className?: string
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search badges by name, description, or issuer...',
  showSuggestions = true,
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestionsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2 && showSuggestions) {
        fetchSuggestions(query)
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, showSuggestions])

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestionsVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/badges/suggestions?q=${encodeURIComponent(searchQuery)}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuggestions(data.data)
        setShowSuggestionsVisible(true)
      } else {
        throw new Error(data.error || 'Failed to fetch suggestions')
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setError(error instanceof Error ? error.message : 'Failed to load suggestions')
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    onSearch(query)
    setShowSuggestionsVisible(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestionsVisible(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.name)
    onSearch(suggestion.name)
    setShowSuggestionsVisible(false)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    setSuggestions([])
  }

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => suggestions.length > 0 && setShowSuggestionsVisible(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {query && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestionsVisible && suggestions.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading suggestions...
            </div>
          ) : (
            <ul className="py-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{suggestion.name}</p>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {suggestion.description}
                        </p>
                      </div>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize flex-shrink-0">
                        {suggestion.category}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* No results */}
      {showSuggestionsVisible && query.length >= 2 && suggestions.length === 0 && !isLoading && !error && (
        <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <p className="text-gray-500 text-center">No badges found matching "{query}"</p>
        </div>
      )}

      {/* Error message */}
      {error && showSuggestionsVisible && (
        <div className="absolute z-10 mt-2 w-full bg-red-50 rounded-lg shadow-lg border border-red-200 p-4">
          <p className="text-red-600 text-center text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
