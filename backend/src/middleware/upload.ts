import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/avatars')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex')
    const ext = path.extname(file.originalname)
    cb(null, `avatar-${uniqueSuffix}${ext}`)
  }
})

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'))
  }
}

// Configure multer
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
})

// Helper function to delete old avatar
export const deleteOldAvatar = (avatarPath: string) => {
  if (!avatarPath) return

  try {
    // Extract filename from path
    const filename = path.basename(avatarPath)
    const filePath = path.join(uploadsDir, filename)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error deleting old avatar:', error)
  }
}
