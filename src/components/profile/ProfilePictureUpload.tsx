'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, User } from 'lucide-react'
import Image from 'next/image'

interface ProfilePictureUploadProps {
  currentAvatar?: string
  onUpload: (avatarUrl: string) => void
}

export default function ProfilePictureUpload({ currentAvatar, onUpload }: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentAvatar || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/users/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.avatar) {
        onUpload(data.avatar)
      } else {
        throw new Error(data.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload image. Please try again.')
      setPreview(currentAvatar || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
          {preview ? (
            <Image
              src={preview}
              alt="Profile"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16 text-gray-400" />
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {preview && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
            aria-label="Remove picture"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Picture'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          JPG, PNG, GIF or WebP. Max size 5MB.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}
