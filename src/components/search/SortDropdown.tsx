'use client'

import { useState } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'

export type SortOption = 'newest' | 'oldest' | 'level-high' | 'level-low' | 'name-asc' | 'name-desc'

interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
  className?: string
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'level-high', label: 'Level: High to Low' },
  { value: 'level-low', label: 'Level: Low to High' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
]

export default function SortDropdown({ value, onChange, className = '' }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = sortOptions.find((opt) => opt.value === value) || sortOptions[0]

  const handleSelect = (option: SortOption) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <ArrowUpDown className="w-5 h-5" />
        <span className="font-medium">{selectedOption.label}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors ${
                    value === option.value ? 'bg-blue-50' : ''
                  }`}
                >
                  <span
                    className={`${
                      value === option.value ? 'text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </span>
                  {value === option.value && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
