'use client'

import { useState } from 'react'
import { Award, Upload, Palette } from 'lucide-react'

interface BadgeFormData {
  name: string
  description: string
  category: string
  level: number
  icon: string
  community: string
  requirements: string
}

interface BadgeFormProps {
  onSubmit: (data: BadgeFormData) => void
  communities: Array<{ id: string; name: string }>
}

const categories = [
  'skill',
  'participation',
  'contribution',
  'leadership',
  'learning',
  'achievement',
  'milestone'
]

const iconOptions = [
  '🏆', '🎯', '⭐', '🚀', '💎', '🔥', '⚡', '🌟',
  '🎨', '💻', '📚', '🎓', '🛠️', '🎪', '🎭', '🎨'
]

export default function BadgeForm({ onSubmit, communities }: BadgeFormProps) {
  const [formData, setFormData] = useState<BadgeFormData>({
    name: '',
    description: '',
    category: 'skill',
    level: 1,
    icon: '🏆',
    community: communities[0]?.id || '',
    requirements: ''
  })

  const [preview, setPreview] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (field: keyof BadgeFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Python Beginner"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe what this badge represents..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level *
              </label>
              <select
                value={formData.level}
                onChange={(e) => handleChange('level', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5].map(level => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community *
            </label>
            <select
              value={formData.community}
              onChange={(e) => handleChange('community', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {communities.map(community => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {iconOptions.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleChange('icon', icon)}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-colors ${
                    formData.icon === icon
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => handleChange('requirements', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="What does someone need to do to earn this badge?"
            />
          </div>

          <div className="flex space-x-4">
            <button type="submit" className="btn-primary flex-1">
              Create Badge Template
            </button>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="btn-secondary"
            >
              {preview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
        </form>
      </div>

      {preview && (
        <div className="lg:sticky lg:top-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Badge Preview</h3>
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">{formData.icon}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {formData.name || 'Badge Name'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {communities.find(c => c.id === formData.community)?.name || 'Community'}
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Level {formData.level}
              </span>
            </div>
            
            <p className="text-gray-700 mb-4">
              {formData.description || 'Badge description will appear here...'}
            </p>
            
            <div className="text-sm text-gray-500">
              <span className="capitalize">{formData.category}</span> • Just now
            </div>
          </div>
        </div>
      )}
    </div>
  )
}