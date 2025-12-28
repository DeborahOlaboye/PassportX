# User Profile Customization

## Overview

The User Profile Customization feature allows users to personalize their PassportX profiles with custom pictures, bios, social media links, custom URLs, and theme preferences. This document covers the implementation details, API endpoints, components, and usage examples.

## Features

### 1. Profile Picture Upload
- Upload profile pictures (JPG, PNG, GIF, WebP)
- Maximum file size: 5MB
- Automatic image validation and optimization
- Preview before upload
- Remove/replace existing pictures

### 2. Basic Information
- Display name (max 100 characters)
- Bio/description (max 500 characters)
- Character count indicators
- Optional public/private profile toggle

### 3. Custom URL
- Personalized profile URL: `passportx.app/u/your-custom-url`
- Real-time availability checking
- Format validation (lowercase letters, numbers, hyphens only)
- Length: 3-30 characters
- Reserved word protection
- Automatic sanitization

### 4. Social Media Links
- Twitter (username)
- GitHub (username)
- LinkedIn (username)
- Discord (username)
- Website (full URL)
- Automatic URL formatting and validation

### 5. Theme Preferences
- Theme modes: Light, Dark, System
- Custom accent color picker
- Persistent across sessions
- System theme detection
- CSS variable integration

## Architecture

### Backend Structure

```
backend/
├── src/
│   ├── models/
│   │   └── User.ts                 # Extended user schema
│   ├── middleware/
│   │   └── upload.ts               # Multer file upload configuration
│   ├── routes/
│   │   └── users.ts                # Profile API endpoints
│   └── types/
│       └── index.ts                # TypeScript interfaces
└── uploads/
    └── avatars/                    # Uploaded profile pictures
```

### Frontend Structure

```
src/
├── app/
│   ├── settings/
│   │   └── profile/
│   │       └── page.tsx            # Profile settings page
│   ├── u/
│   │   └── [customUrl]/
│   │       └── page.tsx            # Public profile view
│   └── api/
│       └── users/
│           └── profile/
│               ├── route.ts        # Profile CRUD proxy
│               ├── avatar/
│               │   └── route.ts    # Avatar upload proxy
│               └── check-url/
│                   └── [customUrl]/
│                       └── route.ts # URL availability check
├── components/
│   └── profile/
│       └── ProfilePictureUpload.tsx # Upload component
├── contexts/
│   └── ThemeContext.tsx            # Theme state management
└── utils/
    └── profileValidation.ts        # Validation utilities
```

## API Endpoints

### Backend Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "user_id",
  "stacksAddress": "SP...",
  "name": "John Doe",
  "bio": "Web3 enthusiast",
  "avatar": "/uploads/avatars/abc123.jpg",
  "customUrl": "johndoe",
  "socialLinks": {
    "twitter": "johndoe",
    "github": "johndoe",
    "linkedin": "johndoe",
    "discord": "johndoe#1234",
    "website": "https://johndoe.com"
  },
  "themePreferences": {
    "mode": "dark",
    "accentColor": "#3B82F6"
  },
  "isPublic": true,
  "joinDate": "2024-01-15T10:30:00Z"
}
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "bio": "Web3 enthusiast and builder",
  "customUrl": "johndoe",
  "socialLinks": {
    "twitter": "johndoe",
    "github": "johndoe"
  },
  "themePreferences": {
    "mode": "dark",
    "accentColor": "#3B82F6"
  },
  "isPublic": true
}

Response: 200 OK
{
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

#### Upload Avatar
```http
POST /api/users/profile/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
  avatar: <file>

Response: 200 OK
{
  "message": "Avatar uploaded successfully",
  "avatar": "/uploads/avatars/abc123.jpg"
}
```

#### Check Custom URL Availability
```http
GET /api/users/profile/check-url/:customUrl

Response: 200 OK
{
  "available": true
}

Response: 200 OK
{
  "available": false
}
```

#### Get Public Profile by Custom URL
```http
GET /api/users/profile?customUrl=johndoe

Response: 200 OK
{
  "id": "user_id",
  "name": "John Doe",
  "bio": "Web3 enthusiast",
  "avatar": "/uploads/avatars/abc123.jpg",
  "customUrl": "johndoe",
  "socialLinks": { /* ... */ },
  "isPublic": true,
  "joinDate": "2024-01-15T10:30:00Z"
}

Response: 404 Not Found
{
  "error": "Profile not found or is private"
}
```

### Next.js API Routes

All Next.js API routes (`/api/users/*`) proxy requests to the Express backend at `BACKEND_URL` (default: `http://localhost:3001`).

## Database Schema

### User Model Extensions

```typescript
interface IUserSocialLinks {
  twitter?: string
  github?: string
  linkedin?: string
  discord?: string
  website?: string
}

interface IUserThemePreferences {
  mode: 'light' | 'dark' | 'system'
  accentColor?: string
}

interface IUser extends Document {
  // Existing fields
  stacksAddress: string
  email?: string

  // New profile customization fields
  name?: string
  bio?: string
  avatar?: string
  customUrl?: string
  socialLinks?: IUserSocialLinks
  themePreferences?: IUserThemePreferences
  isPublic: boolean
  joinDate: Date
}
```

### Validation Rules

#### Custom URL
- **Format**: Lowercase letters, numbers, and hyphens only (`/^[a-z0-9-]+$/`)
- **Length**: 3-30 characters
- **Restrictions**:
  - Cannot start or end with hyphen
  - Cannot contain consecutive hyphens
  - Cannot be a reserved word (admin, api, app, auth, etc.)
- **Uniqueness**: Must be unique across all users
- **Index**: Unique sparse index for performance

#### Display Name
- **Length**: 0-100 characters
- **Optional**: Can be empty

#### Bio
- **Length**: 0-500 characters
- **Optional**: Can be empty

#### Social Links
- **Username Format**: Letters, numbers, underscores, hyphens
- **Length**: 1-50 characters (after removing @)
- **Website**: Must be valid URL format
- **Optional**: All social links are optional

#### Avatar
- **File Types**: image/jpeg, image/png, image/gif, image/webp
- **Max Size**: 5MB
- **Validation**: Performed on both client and server

#### Theme Preferences
- **Mode**: Must be 'light', 'dark', or 'system'
- **Accent Color**: Must be valid hex color (`/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/`)

## Components

### ProfilePictureUpload

Upload component with preview, validation, and progress indication.

**Location**: `src/components/profile/ProfilePictureUpload.tsx`

**Props**:
```typescript
interface ProfilePictureUploadProps {
  currentAvatar?: string
  onUpload: (avatarUrl: string) => void
}
```

**Features**:
- Drag & drop support via file input
- Image preview before upload
- Upload progress indication
- Error handling with user feedback
- Remove picture functionality
- Client-side validation (type, size)
- Automatic file cleanup on replace

**Usage**:
```tsx
<ProfilePictureUpload
  currentAvatar={profileData.avatar}
  onUpload={(avatar) => setProfileData(prev => ({ ...prev, avatar }))}
/>
```

### ProfileSettingsPage

Comprehensive profile editing page with all customization options.

**Location**: `src/app/settings/profile/page.tsx`

**Features**:
- Profile picture upload integration
- Basic information form (name, bio)
- Real-time custom URL availability checking
- Social links management
- Theme preferences configuration
- Public/private toggle
- Form validation with error messages
- Success feedback
- Auto-save to localStorage
- Responsive design

**State Management**:
```typescript
const [profileData, setProfileData] = useState({
  name: '',
  bio: '',
  avatar: '',
  customUrl: '',
  socialLinks: {
    twitter: '',
    github: '',
    linkedin: '',
    discord: '',
    website: ''
  },
  themePreferences: {
    mode: theme as 'light' | 'dark' | 'system',
    accentColor: accentColor
  },
  isPublic: true
})
```

### PublicProfilePage

Public-facing profile view accessible via custom URL.

**Location**: `src/app/u/[customUrl]/page.tsx`

**Features**:
- Dynamic route handling
- Profile data fetching
- Loading states
- Error handling (404 for private/missing profiles)
- Avatar display with fallback
- Social links with platform-specific formatting
- Join date display
- Responsive layout
- Badge collection placeholder

**Route**:
```
/u/[customUrl] → PublicProfilePage
Example: /u/johndoe
```

### ThemeContext

Global theme state management with persistence.

**Location**: `src/contexts/ThemeContext.tsx`

**Features**:
- Theme mode management (light/dark/system)
- System theme detection
- Accent color customization
- localStorage persistence
- CSS variable injection
- Auto-apply on load
- Media query listener for system changes

**Usage**:
```tsx
// Wrap app with provider
<ThemeProvider>
  <App />
</ThemeProvider>

// Use in components
const { theme, effectiveTheme, accentColor, setTheme, setAccentColor } = useTheme()
```

**Context API**:
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  effectiveTheme: 'light' | 'dark'
  accentColor: string
  setTheme: (mode: ThemeMode) => void
  setAccentColor: (color: string) => void
  updateThemePreferences: (preferences: ThemePreferences) => void
}
```

## Validation Utilities

**Location**: `src/utils/profileValidation.ts`

### Available Functions

#### validateCustomUrl(url: string): ValidationResult
Validates custom URL format and restrictions.

**Checks**:
- Required field
- Length constraints (3-30)
- Format regex
- Hyphen rules
- Reserved words

**Example**:
```typescript
const result = validateCustomUrl('john-doe')
if (!result.isValid) {
  console.error(result.error)
}
```

#### validateDisplayName(name: string): ValidationResult
Validates display name length.

#### validateBio(bio: string): ValidationResult
Validates bio length.

#### validateUrl(url: string): ValidationResult
Validates URL format for website links.

#### validateSocialUsername(username: string, platform: string): ValidationResult
Validates social media usernames.

#### validateHexColor(color: string): ValidationResult
Validates hex color codes.

#### validateProfileData(data: ProfileData): ValidationResult
Validates entire profile object with all fields.

**Example**:
```typescript
const validation = validateProfileData(profileData)
if (!validation.isValid) {
  setError(validation.error || 'Validation failed')
  return
}
```

#### sanitizeCustomUrl(url: string): string
Sanitizes and formats custom URL input.

**Transformations**:
- Converts to lowercase
- Removes invalid characters
- Removes leading/trailing hyphens
- Replaces consecutive hyphens
- Truncates to 30 characters

**Example**:
```typescript
const sanitized = sanitizeCustomUrl('John_Doe@123!!') // Returns: 'john-doe123'
```

#### sanitizeSocialUsername(username: string): string
Sanitizes social media username input.

## File Upload Configuration

### Multer Middleware

**Location**: `backend/src/middleware/upload.ts`

**Configuration**:
```typescript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(16).toString('hex')
    const ext = path.extname(file.originalname)
    cb(null, `${uniqueId}${ext}`)
  }
})

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'))
  }
}

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})
```

**Features**:
- Automatic directory creation
- Unique filename generation with crypto
- File type validation
- Size limits (5MB)
- Error handling

**Usage in Routes**:
```typescript
router.post('/profile/avatar',
  authenticateToken,
  uploadAvatar.single('avatar'),
  async (req, res, next) => {
    // Handle upload
  }
)
```

## Responsive Design

### Breakpoints

The profile customization UI is responsive across all device sizes:

- **Mobile** (< 640px): Single column layout, full-width inputs
- **Tablet** (640px - 1024px): Two-column social links grid
- **Desktop** (> 1024px): Optimized spacing, multi-column layouts

### Key Responsive Patterns

```tsx
// Flex direction changes
className="flex flex-col sm:flex-row items-center gap-6"

// Grid columns
className="grid grid-cols-1 md:grid-cols-2 gap-4"

// Text alignment
className="text-center sm:text-left"

// Padding adjustments
className="px-4 sm:px-6 lg:px-8"
```

## Security Considerations

### File Upload Security
- File type validation on both client and server
- File size limits enforced
- Unique random filenames prevent collisions
- Old files deleted on replacement
- Uploads stored outside web root

### URL Validation
- Reserved words blacklist prevents system route conflicts
- Format restrictions prevent injection attacks
- Uniqueness enforced at database level
- Input sanitization on all inputs

### Authentication
- All profile modification endpoints require authentication
- JWT token validation via `authenticateToken` middleware
- User can only modify their own profile
- Public profiles accessible without auth

### Data Privacy
- `isPublic` flag controls profile visibility
- Private profiles return 404 to unauthorized users
- Sensitive data (email, stacksAddress) not exposed on public profiles

## Usage Examples

### Complete Profile Update Flow

```typescript
// 1. Fetch existing profile
const fetchProfile = async () => {
  const response = await fetch('/api/users/profile', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  const data = await response.json()
  setProfileData(data)
}

// 2. Update profile data
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // Validate
  const validation = validateProfileData(profileData)
  if (!validation.isValid) {
    setError(validation.error)
    return
  }

  // Check custom URL availability
  if (profileData.customUrl && customUrlAvailable === false) {
    setError('Custom URL is not available')
    return
  }

  // Submit
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(profileData)
  })

  if (response.ok) {
    setSuccess(true)
    // Update theme context
    if (profileData.themePreferences) {
      updateThemePreferences(profileData.themePreferences)
    }
  }
}
```

### Real-time Custom URL Check

```typescript
useEffect(() => {
  if (!profileData.customUrl || profileData.customUrl.length < 3) {
    setCustomUrlAvailable(null)
    return
  }

  const timer = setTimeout(() => {
    checkCustomUrl(profileData.customUrl)
  }, 500) // Debounce

  return () => clearTimeout(timer)
}, [profileData.customUrl])

const checkCustomUrl = async (url: string) => {
  setCheckingUrl(true)
  const response = await fetch(`/api/users/profile/check-url/${url}`)
  const data = await response.json()
  setCustomUrlAvailable(data.available)
  setCheckingUrl(false)
}
```

### Theme Management

```typescript
// Initialize theme from profile
useEffect(() => {
  if (profileData.themePreferences) {
    updateThemePreferences(profileData.themePreferences)
  }
}, [profileData])

// Update theme
const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
  setProfileData(prev => ({
    ...prev,
    themePreferences: { ...prev.themePreferences, mode }
  }))
}

// Update accent color
const handleColorChange = (color: string) => {
  setProfileData(prev => ({
    ...prev,
    themePreferences: { ...prev.themePreferences, accentColor: color }
  }))
}
```

### Avatar Upload

```typescript
const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Validate
  if (!file.type.startsWith('image/')) {
    setError('Please select an image file')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    setError('File size must be less than 5MB')
    return
  }

  // Create preview
  const reader = new FileReader()
  reader.onloadend = () => {
    setPreview(reader.result as string)
  }
  reader.readAsDataURL(file)

  // Upload
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
  }
}
```

## Testing

### Manual Testing Checklist

#### Profile Picture Upload
- [ ] Upload valid image (JPG, PNG, GIF, WebP)
- [ ] Attempt to upload invalid file type
- [ ] Attempt to upload file > 5MB
- [ ] Preview displays correctly
- [ ] Remove picture functionality works
- [ ] Replace existing picture (old file deleted)

#### Custom URL
- [ ] Create custom URL (3-30 characters)
- [ ] Real-time availability checking works
- [ ] Invalid formats rejected (uppercase, special chars)
- [ ] Reserved words rejected
- [ ] Duplicate URLs rejected
- [ ] URL persists and loads correctly

#### Social Links
- [ ] Add valid usernames for each platform
- [ ] Links format correctly on public profile
- [ ] Invalid usernames rejected
- [ ] Website URL validation works
- [ ] Links open in new tab with noopener

#### Theme Preferences
- [ ] Light mode applies correctly
- [ ] Dark mode applies correctly
- [ ] System mode detects OS preference
- [ ] Custom accent color applies
- [ ] Theme persists across sessions
- [ ] CSS variables update properly

#### Public Profile
- [ ] Public profile accessible via custom URL
- [ ] Private profile returns 404
- [ ] Missing profile returns 404
- [ ] Avatar displays with fallback
- [ ] Social links render correctly
- [ ] Join date formats properly

#### Validation
- [ ] Name length limit enforced
- [ ] Bio length limit enforced
- [ ] Character counters update
- [ ] Form submission prevented on invalid data
- [ ] Error messages display clearly
- [ ] Success message displays on save

#### Responsive Design
- [ ] Mobile layout (< 640px) works
- [ ] Tablet layout (640px - 1024px) works
- [ ] Desktop layout (> 1024px) works
- [ ] Touch interactions work on mobile
- [ ] Scrolling works properly
- [ ] No horizontal overflow

## Related Issues

- **Issue #20**: Implement User Profile Customization (this feature)

## Future Enhancements

1. **Image Cropping**: Add image cropping tool before upload
2. **Multiple Avatars**: Allow users to upload and switch between multiple avatars
3. **Profile Themes**: Preset theme combinations for quick selection
4. **Profile Analytics**: Track profile views and engagement
5. **Badge Integration**: Display earned badges on profile
6. **Profile Sharing**: Generate shareable profile cards/images
7. **Custom Backgrounds**: Allow custom background images or patterns
8. **Profile Verification**: Verification badges for confirmed identities
9. **Social Proof**: Display follower counts and connections
10. **Privacy Controls**: Granular control over what information is public

## Troubleshooting

### Avatar Upload Fails

**Problem**: Upload returns error or times out

**Solutions**:
- Check file size (must be < 5MB)
- Verify file type (JPG, PNG, GIF, WebP only)
- Ensure `uploads/avatars` directory has write permissions
- Check `BACKEND_URL` environment variable
- Verify authentication token is valid

### Custom URL Not Available

**Problem**: Desired custom URL shows as taken

**Solutions**:
- Try alternative URL (add numbers, hyphens)
- Check if URL contains reserved words
- Verify URL meets format requirements (lowercase, no special chars)
- Contact support if you believe the URL should be available

### Theme Not Persisting

**Problem**: Theme resets after page reload

**Solutions**:
- Check browser localStorage is enabled
- Verify ThemeProvider wraps entire app
- Ensure theme preferences are saved on profile update
- Check for JavaScript errors in console
- Clear browser cache and retry

### Public Profile 404

**Problem**: Cannot access public profile via custom URL

**Solutions**:
- Verify custom URL is set correctly
- Check that `isPublic` is set to true
- Ensure profile has been saved
- Try accessing via direct URL: `/u/your-custom-url`
- Check for typos in custom URL

### Social Links Not Formatting

**Problem**: Social links don't work or format incorrectly

**Solutions**:
- Ensure usernames don't include @ symbol (automatically stripped)
- For website, use full URL with https://
- Verify no special characters in usernames
- Check that profile has been saved
- Inspect browser console for errors

## Contributing

When contributing to profile customization features:

1. Follow existing validation patterns
2. Add comprehensive error handling
3. Update this documentation
4. Add appropriate tests
5. Follow responsive design patterns
6. Maintain security best practices
7. Use TypeScript types consistently
8. Follow accessibility guidelines

## References

- [Multer Documentation](https://github.com/expressjs/multer)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [React Context API](https://react.dev/reference/react/useContext)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MongoDB Unique Indexes](https://www.mongodb.com/docs/manual/core/index-unique/)
