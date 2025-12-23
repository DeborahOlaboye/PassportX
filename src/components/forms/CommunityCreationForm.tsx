'use client'

import { useState } from 'react'
import { Users, Palette, Settings, Wallet } from 'lucide-react'

interface CommunityFormData {
  name: string
  description: string
  about: string
  website: string
  primaryColor: string
  secondaryColor: string
  stxPayment: number
  allowMemberInvites: boolean
  requireApproval: boolean
  allowBadgeIssuance: boolean
  allowCustomBadges: boolean
  tags: string
}

interface CommunityCreationFormProps {
  onSubmit: (data: CommunityFormData) => Promise<void>
  isLoading?: boolean
  error?: string
}

const colorPresets = [
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Green', color: '#10b981' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Indigo', color: '#6366f1' }
]

export default function CommunityCreationForm({ 
  onSubmit, 
  isLoading = false,
  error = ''
}: CommunityCreationFormProps) {
  const [formData, setFormData] = useState<CommunityFormData>({
    name: '',
    description: '',
    about: '',
    website: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    stxPayment: 100,
    allowMemberInvites: true,
    requireApproval: false,
    allowBadgeIssuance: true,
    allowCustomBadges: false,
    tags: ''
  })

  const [preview, setPreview] = useState(true)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Community name is required'
    } else if (formData.name.length > 100) {
      errors.name = 'Community name must be less than 100 characters'
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    } else if (formData.description.length > 2000) {
      errors.description = 'Description must be less than 2000 characters'
    }

    if (formData.about && formData.about.length > 5000) {
      errors.about = 'About section must be less than 5000 characters'
    }

    if (formData.website && !isValidUrl(formData.website)) {
      errors.website = 'Please enter a valid URL'
    }

    if (formData.stxPayment < 0) {
      errors.stxPayment = 'STX payment must be a positive number'
    } else if (formData.stxPayment > 1000000) {
      errors.stxPayment = 'STX payment exceeds maximum allowed'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      console.error('Form submission error:', err)
    }
  }

  const handleChange = (field: keyof CommunityFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                validationErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Web3 Developers"
              disabled={isLoading}
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                validationErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief description of your community..."
              disabled={isLoading}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About
            </label>
            <textarea
              value={formData.about}
              onChange={(e) => handleChange('about', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                validationErrors.about ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Detailed information about your community..."
              disabled={isLoading}
            />
            {validationErrors.about && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.about}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                validationErrors.website ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://example.com"
              disabled={isLoading}
            />
            {validationErrors.website && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.website}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., blockchain, development, education"
              disabled={isLoading}
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Theme</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Primary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-600">{formData.primaryColor}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => handleChange('primaryColor', preset.color)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.primaryColor === preset.color
                        ? 'border-gray-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Secondary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleChange('secondaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-600">{formData.secondaryColor}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Community Settings</span>
            </h3>

            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowMemberInvites}
                  onChange={(e) => handleChange('allowMemberInvites', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">Allow member invites</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireApproval}
                  onChange={(e) => handleChange('requireApproval', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">Require approval for new members</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowBadgeIssuance}
                  onChange={(e) => handleChange('allowBadgeIssuance', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">Allow badge issuance</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowCustomBadges}
                  onChange={(e) => handleChange('allowCustomBadges', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">Allow custom badge templates</span>
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Wallet className="w-5 h-5" />
              <span>Creation Fee</span>
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                STX Payment Amount *
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={formData.stxPayment}
                  onChange={(e) => handleChange('stxPayment', Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    validationErrors.stxPayment ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="100"
                  min="0"
                  disabled={isLoading}
                />
                <span className="text-sm font-medium text-gray-700">STX</span>
              </div>
              {validationErrors.stxPayment && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.stxPayment}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                This is the one-time fee required to create the community on-chain
              </p>
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <button 
              type="submit" 
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Community...' : 'Create Community'}
            </button>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="btn-secondary"
              disabled={isLoading}
            >
              {preview ? 'Hide' : 'Show'} Preview
            </button>
          </div>
        </form>
      </div>

      {preview && (
        <div className="lg:sticky lg:top-8 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Community Preview</h3>
          
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  {formData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {formData.name || 'Community Name'}
                  </h4>
                  <p className="text-xs text-gray-500">Community</p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm mb-4">
              {formData.description || 'Community description will appear here...'}
            </p>

            {formData.tags && (
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.tags.split(',').map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${formData.primaryColor}20`,
                      color: formData.primaryColor
                    }}
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Creation Fee</span>
                  <span className="font-medium">{formData.stxPayment} STX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Approval</span>
                  <span className="font-medium">
                    {formData.requireApproval ? 'Required' : 'Not Required'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-4 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> After creation, you'll need to confirm the transaction in your wallet to complete the on-chain registration.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
