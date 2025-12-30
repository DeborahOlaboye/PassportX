'use client'

import { useState, useEffect } from 'react'
import { Award, Mail, User, Loader } from 'lucide-react'
import {
  validateBadgeIssuanceForm
} from '@/lib/validation/badgeValidation'

interface BadgeTemplate {
  id: number
  name: string
  description: string
  category: string
  level: number
  icon?: string
  community: string
}

interface BadgeIssuanceFormData {
  recipientAddress: string
  recipientName: string
  recipientEmail: string
  templateId: number
  communityId: number
}

interface BadgeIssuanceFormProps {
  onSubmit: (data: BadgeIssuanceFormData) => Promise<void>
  templates: BadgeTemplate[]
  isLoading?: boolean
  error?: string
}

const categoryColors: Record<string, string> = {
  skill: 'bg-blue-100 text-blue-800',
  participation: 'bg-green-100 text-green-800',
  contribution: 'bg-purple-100 text-purple-800',
  leadership: 'bg-orange-100 text-orange-800',
  learning: 'bg-yellow-100 text-yellow-800',
  achievement: 'bg-pink-100 text-pink-800',
  milestone: 'bg-indigo-100 text-indigo-800'
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

export default function BadgeIssuanceForm({
  onSubmit,
  templates,
  isLoading = false,
  error = ''
}: BadgeIssuanceFormProps) {
  const [formData, setFormData] = useState<BadgeIssuanceFormData>({
    recipientAddress: '',
    recipientName: '',
    recipientEmail: '',
    templateId: templates[0]?.id || 0,
    communityId: 0
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState(true)

  const selectedTemplate = templates.find(t => t.id === formData.templateId)

  const validateForm = (): boolean => {
    const validationResult = validateBadgeIssuanceForm({
      recipientName: formData.recipientName,
      recipientAddress: formData.recipientAddress,
      recipientEmail: formData.recipientEmail,
      templateId: formData.templateId,
      communityId: formData.communityId
    })

    if (!validationResult.valid) {
      const errors: Record<string, string> = {}
      validationResult.errors.forEach((error) => {
        errors[error.field] = error.message
      })
      setValidationErrors(errors)
      return false
    }

    setValidationErrors({})
    return true
  }

  const handleChange = (field: keyof BadgeIssuanceFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      await onSubmit(formData)
    } catch (err) {
      console.error('Form submission error:', err)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Template *
            </label>
            <select
              value={formData.templateId}
              onChange={(e) => handleChange('templateId', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                validationErrors.templateId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value={0}>Select a badge...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} (Level {template.level})
                </option>
              ))}
            </select>
            {validationErrors.templateId && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.templateId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Recipient Name *
            </label>
            <input
              type="text"
              value={formData.recipientName}
              onChange={(e) => handleChange('recipientName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                validationErrors.recipientName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., John Doe"
            />
            {validationErrors.recipientName && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.recipientName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Stacks Address *
            </label>
            <input
              type="text"
              value={formData.recipientAddress}
              onChange={(e) => handleChange('recipientAddress', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm ${
                validationErrors.recipientAddress ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., SP2QVPXEWYQFT45C84WXNHQ67GVJHQ7XQEQD35Z4K"
            />
            {validationErrors.recipientAddress && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.recipientAddress}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Recipient Email (Optional)
            </label>
            <input
              type="email"
              value={formData.recipientEmail}
              onChange={(e) => handleChange('recipientEmail', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                validationErrors.recipientEmail ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., john@example.com"
            />
            {validationErrors.recipientEmail && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.recipientEmail}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  Issue Badge
                </>
              )}
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

      {preview && selectedTemplate && (
        <div className="lg:sticky lg:top-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Badge Preview</h3>
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">
                    {selectedTemplate.icon || '🏆'}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {selectedTemplate.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    To: {formData.recipientName || 'Recipient'}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(selectedTemplate.level)}`}>
                Level {selectedTemplate.level}
              </span>
            </div>

            <p className="text-gray-700 mb-4">
              {selectedTemplate.description}
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Category:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[selectedTemplate.category] || 'bg-gray-100 text-gray-800'}`}>
                  {selectedTemplate.category}
                </span>
              </div>
              
              {formData.recipientEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Recipient Email:</span>
                  <span className="text-gray-900 font-mono text-xs">{formData.recipientEmail}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-600">Status:</span>
                <span className="text-gray-900 font-medium">Ready to Issue</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
