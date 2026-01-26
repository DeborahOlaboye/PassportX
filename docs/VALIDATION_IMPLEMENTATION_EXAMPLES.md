/**
 * Example implementations of parameter validation for various route patterns
 * Copy and adapt these patterns for any new dynamic routes
 */

// ============================================================================
// Example 1: Simple Dynamic Route with Stacks Address
// ============================================================================
/*
File: src/app/user/[address]/page.tsx

import { notFound } from 'next/navigation'
import { validateUserIdParameter, isSafeFromInjection } from '@/utils/validation'

export default function UserPage({ params }: { params: { address: string } }) {
  // Validate at entry point
  const validation = validateUserIdParameter(params.address)
  
  if (!validation.isValid || !isSafeFromInjection(validation.sanitized || '')) {
    notFound()
  }

  // Use validated parameter safely
  const address = validation.sanitized!
  
  // Fetch user data with validated address
  const userData = fetchUserByAddress(address)
  
  return (
    <div>
      {/* Render user data safely */}
    </div>
  )
}
*/

// ============================================================================
// Example 2: Custom URL Route with Optional Filters
// ============================================================================
/*
File: src/app/profile/[slug]/page.tsx

import { notFound } from 'next/navigation'
import { validateCustomUrlParameter, isSafeFromInjection } from '@/utils/validation'

interface PageProps {
  params: { slug: string }
  searchParams: { tab?: string; filter?: string }
}

export default function ProfilePage({ params, searchParams }: PageProps) {
  // Validate route parameter
  const slugValidation = validateCustomUrlParameter(params.slug)
  if (!slugValidation.isValid) {
    notFound()
  }

  // Validate query parameters
  const tab = searchParams.tab ? validateTabParameter(searchParams.tab) : 'overview'
  const filter = searchParams.filter ? validateFilter(searchParams.filter) : ''

  const slug = slugValidation.sanitized!

  return (
    <div>
      {/* Render profile with validated slug and query params */}
    </div>
  )
}
*/

// ============================================================================
// Example 3: API Route with Query Parameters
// ============================================================================
/*
File: src/app/api/profiles/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { 
  validateApiQueryParams, 
  validateCustomUrlApiParam,
  createApiErrorResponse 
} from '@/utils/api-validation'

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)

    // Validate required query parameters
    const validated = validateApiQueryParams(searchParams, {
      customUrl: validateCustomUrlApiParam
    })

    // Use validated parameters in database query
    const profile = await db.profiles.findOne({
      customUrl: validated.customUrl
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    const { status = 400, message = 'Invalid request' } = error
    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}
*/

// ============================================================================
// Example 4: Multiple Dynamic Segments
// ============================================================================
/*
File: src/app/community/[id]/badge/[badgeId]/page.tsx

import { notFound } from 'next/navigation'
import { validateMultipleParams } from '@/utils/route-validation'
import { validateUserIdParameter, isValidUserId } from '@/utils/validation'

interface BadgePageProps {
  params: { id: string; badgeId: string }
}

export default function BadgePage({ params }: BadgePageProps) {
  // Validate multiple parameters at once
  let validated: Record<string, string>
  
  try {
    validated = validateMultipleParams(params, {
      id: validateUserIdParameter,
      badgeId: (value) => {
        if (!value || typeof value !== 'string') {
          return { isValid: false, error: 'Badge ID required' }
        }
        if (!isValidUserId(value)) {
          return { isValid: false, error: 'Invalid badge ID' }
        }
        return { isValid: true, sanitized: value }
      }
    })
  } catch (error) {
    notFound()
  }

  const { id, badgeId } = validated

  // Fetch badge data safely
  const badge = fetchBadge(id, badgeId)

  return (
    <div>
      {/* Render badge details */}
    </div>
  )
}
*/

// ============================================================================
// Example 5: Server Component with Database Query
// ============================================================================
/*
File: src/app/team/[teamSlug]/settings/page.tsx

import { notFound } from 'next/navigation'
import { validateCustomUrlParameter } from '@/utils/validation'

interface SettingsPageProps {
  params: { teamSlug: string }
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  // Validate parameter
  const validation = validateCustomUrlParameter(params.teamSlug)
  
  if (!validation.isValid) {
    notFound()
  }

  const teamSlug = validation.sanitized!

  // Fetch team data server-side with validated parameter
  const team = await db.teams.findOne({ slug: teamSlug })
  
  if (!team) {
    notFound()
  }

  return (
    <div>
      <h1>Settings for {team.name}</h1>
      {/* Render settings form */}
    </div>
  )
}
*/

// ============================================================================
// Example 6: Route Handler with Validation Middleware
// ============================================================================
/*
File: src/app/api/users/[id]/profile/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { validateRouteParameter } from '@/utils/route-validation'
import { validateUserIdParameter } from '@/utils/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate parameter using middleware
    const validation = validateRouteParameter(
      params,
      'id',
      validateUserIdParameter
    )

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const userId = validation.sanitized!

    // Fetch profile
    const profile = await db.users.findOne({ id: userId })

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
*/

// ============================================================================
// Example 7: Client Component with Dynamic Fetch
// ============================================================================
/*
File: src/components/UserProfile.tsx

'use client'

import { use, useEffect, useState } from 'react'
import { validateCustomUrlParameter, isSafeFromInjection } from '@/utils/validation'

interface UserProfileProps {
  params: Promise<{ customUrl: string }>
}

export default function UserProfile({ params }: UserProfileProps) {
  const resolvedParams = use(params)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [resolvedParams.customUrl])

  const loadProfile = async () => {
    try {
      // Validate parameter
      const validation = validateCustomUrlParameter(resolvedParams.customUrl)
      
      if (!validation.isValid || !isSafeFromInjection(validation.sanitized || '')) {
        setError('Invalid profile URL')
        setLoading(false)
        return
      }

      // Fetch with validated parameter
      const response = await fetch(
        `/api/users/profile?customUrl=${encodeURIComponent(validation.sanitized!)}`
      )

      if (!response.ok) {
        throw new Error('Profile not found')
      }

      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!profile) return <div>Profile not found</div>

  return (
    <div>
      {/* Render profile safely */}
    </div>
  )
}
*/

// ============================================================================
// Example 8: Custom Validator for Domain-Specific Data
// ============================================================================
/*
File: src/utils/validators.ts

import { isSafeFromInjection } from './validation'

export const validateBadgeId = (badgeId: unknown) => {
  if (!badgeId || typeof badgeId !== 'string') {
    return {
      isValid: false,
      error: 'Badge ID is required'
    }
  }

  const trimmed = badgeId.trim()

  // Badge IDs are UUIDs in this example
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid badge ID format'
    }
  }

  if (!isSafeFromInjection(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid characters in badge ID'
    }
  }

  return {
    isValid: true,
    sanitized: trimmed
  }
}

export const validateCommunityName = (name: unknown) => {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: 'Community name is required'
    }
  }

  const trimmed = name.trim()

  // Allow alphanumeric, spaces, hyphens, underscores
  // 2-100 characters
  if (!/^[a-zA-Z0-9\s\-_]{2,100}$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid community name format'
    }
  }

  if (!isSafeFromInjection(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid characters in community name'
    }
  }

  return {
    isValid: true,
    sanitized: trimmed
  }
}
*/

// ============================================================================
// Best Practices Checklist
// ============================================================================
/*
When adding validation to a new route:

✓ Import validation utilities at the top
✓ Validate parameters at component/route entry point
✓ Never pass raw params to database queries
✓ Always use sanitized/validated values
✓ Return notFound() for server components
✓ Return 400/404 errors for API routes
✓ Use specific error messages in development
✓ Use generic error messages in production
✓ Test with injection attempt payloads
✓ Log suspicious attempts (for monitoring)
✓ Update documentation with validation pattern
✓ Add test cases for validation
✓ Consider rate limiting for repeated invalid attempts
✓ Use TypeScript for type safety
✓ Review validation patterns with security team
*/
