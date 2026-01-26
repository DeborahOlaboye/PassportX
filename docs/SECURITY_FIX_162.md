# Dynamic Route Parameter Validation - Security Fix #162

## Overview

This security fix addresses **HIGH severity vulnerabilities** in dynamic route parameter handling. Route parameters were not being validated before use in database queries, allowing potential injection attacks and application errors.

## Vulnerabilities Fixed

### 1. NoSQL Injection
**Risk:** Unvalidated route parameters could be used to inject malicious MongoDB operators
```typescript
// BEFORE (Vulnerable)
const { userId } = params;
const user = await db.users.findOne({ id: userId }); // userId could contain: {"$ne": null}
```

### 2. XSS Attacks
**Risk:** Special characters in parameters could bypass sanitization in rendered content

### 3. Invalid Data Format
**Risk:** Malformed parameters cause database errors and application crashes

### 4. URL Parameter Pollution
**Risk:** Multiple parameter values could bypass validation

## Implementation

### 1. Validation Utilities (`src/utils/validation.ts`)

Core validation functions for route parameters:

#### `isValidStacksAddress(addr: string): boolean`
- Validates Stacks blockchain address format
- Pattern: `S[PM][A-Z0-9]{39}` (case-insensitive)
- Returns `true` only for valid Stacks addresses

#### `isValidCustomUrl(url: string): boolean`
- Validates custom URL slugs
- Allowed characters: alphanumeric, hyphens, underscores
- Length: 3-50 characters
- Case-sensitive validation (lowercased)

#### `isValidUserId(userId: string): boolean`
- Validates user ID format
- Allowed characters: alphanumeric, underscores
- Length: 6-50 characters

#### `sanitizeInput(input: string): string`
- Removes dangerous characters used in injection attacks
- Removes: `< > ' " { } [ ] ( )`
- Limits output to 100 characters

#### `isSafeFromInjection(input: string): boolean`
- Detects injection patterns in input
- Checks for:
  - MongoDB operators: `$where`, `$ne`, `$gt`, `$regex`, `$or`
  - SQL keywords: `union`, `select`, `insert`, `update`, `delete`, `drop`, `create`
  - XSS patterns: `<script>`, `javascript:`, `onerror`, `onload`
  - Template injection: `{{`, `}}`, `{%`, `%}`

#### `validateUserIdParameter(userId: unknown)`
- Returns: `{ isValid: boolean, error?: string, sanitized?: string }`
- Validates both standard user IDs and Stacks addresses
- Provides detailed error messages

#### `validateCustomUrlParameter(customUrl: unknown)`
- Returns: `{ isValid: boolean, error?: string, sanitized?: string }`
- Validates custom URL format with character whitelist
- Provides detailed error messages

### 2. Route Parameter Validation Middleware (`src/utils/route-validation.ts`)

High-level middleware utilities:

#### `validateRouteParams(params, rules)`
- Batch validates multiple route parameters
- `params`: Route parameters object
- `rules`: Map of parameter names to validation functions
- Returns validated parameters or null if any validation fails

#### `validateRouteParameter(params, paramName, validatorFn)`
- Type-safe parameter validation
- Single parameter focus
- Includes injection pattern detection

#### `extractValidatedParam<T>(params, paramName, validator)`
- Type-safe parameter extraction
- Throws error if validation fails
- Useful for strongly-typed components

#### `validateMultipleParams(params, validators)`
- Batch validates and extracts parameters
- Throws on first error

### 3. API Endpoint Validation (`src/utils/api-validation.ts`)

API request validation utilities:

#### `validateQueryParam(value, validatorFn)`
- Validates single query parameter
- Type checks and validation function support

#### `validateApiQueryParams(searchParams, requiredParams)`
- Batch validates API query parameters
- Handles array values
- Throws ValidationError on failure

#### `validateRequestBody(body, schema)`
- Validates JSON request body
- Field-level validation
- Returns validated object

#### `createApiErrorResponse(message, status)`
- Creates standardized API error responses
- Includes timestamp for debugging

### 4. Protected Pages

#### `/src/app/public/passport/[userId]/page.tsx`
- **Changes:**
  - Import validation utilities
  - Validate userId in `generateMetadata()`
  - Validate userId in `PublicPassportPage` component
  - Check for injection patterns
  - Return not found for invalid parameters

#### `/src/app/u/[customUrl]/page.tsx`
- **Changes:**
  - Import validation utilities
  - Validate customUrl at component entry
  - Only fetch if URL is valid
  - Use sanitized URL in API requests
  - Properly encode URL parameters with URLSearchParams

## Security Benefits

1. **NoSQL Injection Prevention**: Validates against MongoDB operator patterns
2. **XSS Protection**: Detects and prevents XSS injection patterns
3. **Input Sanitization**: Removes dangerous characters
4. **Whitelist Validation**: Uses allowlist for valid characters/formats
5. **Early Validation**: Validates at entry point before any processing
6. **Comprehensive Checks**: Multiple layers of validation
7. **Error Handling**: Graceful handling of invalid parameters

## Usage Examples

### Basic Route Parameter Validation
```typescript
import { validateUserIdParameter } from '@/utils/validation'

export default function MyPage({ params }: { params: { userId: string } }) {
  const validation = validateUserIdParameter(params.userId)
  
  if (!validation.isValid) {
    notFound()
  }
  
  const userId = validation.sanitized
  // Use validated userId safely
}
```

### API Endpoint Validation
```typescript
import { validateApiQueryParams, validateCustomUrlApiParam } from '@/utils/api-validation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  try {
    const validated = validateApiQueryParams(
      Object.fromEntries(searchParams),
      { customUrl: validateCustomUrlApiParam }
    )
    
    const profile = await db.profiles.findOne({ customUrl: validated.customUrl })
    return Response.json(profile)
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status })
  }
}
```

### Multiple Parameter Validation
```typescript
import { validateMultipleParams } from '@/utils/route-validation'
import { validateUserIdParameter, validateCustomUrlParameter } from '@/utils/validation'

const validated = validateMultipleParams(params, {
  userId: validateUserIdParameter,
  customUrl: validateCustomUrlParameter
})

const { userId, customUrl } = validated
```

## Testing Recommendations

### Test Cases for Validation

1. **Valid Inputs**
   - Valid Stacks address: `SP2J6ZY48GV6RDZV4R2X5M9Y77XQSRZ2GQ3QTPH8KQ`
   - Valid custom URL: `my-profile`
   - Valid user ID: `user_12345`

2. **Invalid Formats**
   - Wrong Stacks prefix: `AP2J6ZY48GV6RDZV4R2X5M9Y77XQSRZ2GQ3QTPH8KQ`
   - Too short: `abc`
   - Invalid characters: `my@profile!`

3. **Injection Attacks**
   - MongoDB: `{"$ne": null}`
   - SQL: `'; DROP TABLE users; --`
   - XSS: `<script>alert('xss')</script>`
   - Template: `{{7*7}}`

4. **Edge Cases**
   - Empty string: `""`
   - Null value: `null`
   - Undefined: `undefined`
   - Very long string: `"a".repeat(1000)`

## Deployment Notes

1. **Backward Compatibility**: Valid parameters continue to work
2. **Invalid Parameters**: Now return 404/not found instead of errors
3. **Performance**: Validation is minimal (regex checks only)
4. **Error Messages**: Detailed errors in development, generic in production

## Future Improvements

1. Add rate limiting to prevent brute force attacks
2. Add CORS validation for API endpoints
3. Add request signature verification
4. Add audit logging for suspicious requests
5. Add geolocation-based access control

## Related Issues

- Issue #162: Security - No Validation of Dynamic Route Parameters
- Related to: Authentication & authorization improvements
- Depends on: Database query parameterization

## Rollback Instructions

If issues arise:
1. Revert commits on main branch
2. Invalid parameters will start causing errors again
3. Consider partial rollback to specific routes

## References

- [OWASP NoSQL Injection](https://owasp.org/www-community/nosql-injection)
- [OWASP XSS Prevention](https://owasp.org/www-community/attacks/xss/)
- [Stacks Address Format](https://docs.stacks.co/docs/clarity/fundamentals/address)
- [Input Validation Best Practices](https://owasp.org/www-community/controls/Input_Validation)
