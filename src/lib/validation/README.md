# Badge Validation Module

This module provides comprehensive validation for badge metadata and badge issuance forms in the PassportX application.

## Features

- **Name Validation**: Ensures badge names are 1-64 characters, alphanumeric and spaces only
- **Description Validation**: Enforces 10-256 character requirement for descriptions
- **Category Validation**: Verifies category exists in predefined list
- **Level Validation**: Ensures level is an integer between 1-5
- **Form Validation**: Combined validation for badge creation and issuance forms

## Usage

### Basic Validation

```typescript
import {
  validateBadgeName,
  validateBadgeDescription,
  validateBadgeCategory,
  validateBadgeLevel,
  validateBadgeMetadata
} from '@/lib/validation/badgeValidation'

// Validate individual fields
const nameError = validateBadgeName('Python Master')
if (nameError) {
  console.error(nameError.message)
}

// Validate all metadata at once
const result = validateBadgeMetadata({
  name: 'Python Master',
  description: 'Mastery of Python programming language',
  category: 'skill',
  level: 3
})

if (!result.valid) {
  result.errors.forEach(error => {
    console.error(`${error.field}: ${error.message}`)
  })
}
```

### Form Integration

```typescript
import { validateBadgeMetadata } from '@/lib/validation/badgeValidation'

const handleSubmit = (formData) => {
  const validationResult = validateBadgeMetadata(formData)

  if (!validationResult.valid) {
    const errors = {}
    validationResult.errors.forEach(error => {
      errors[error.field] = error.message
    })
    setValidationErrors(errors)
    return
  }

  // Proceed with form submission
  onSubmit(formData)
}
```

## Validation Constants

All validation constraints are exported via the `VALIDATION_CONSTANTS` object:

```typescript
import { VALIDATION_CONSTANTS } from '@/lib/validation/badgeValidation'

console.log(VALIDATION_CONSTANTS.MAX_BADGE_NAME_LENGTH) // 64
console.log(VALIDATION_CONSTANTS.MIN_BADGE_DESCRIPTION_LENGTH) // 10
console.log(VALIDATION_CONSTANTS.MAX_BADGE_DESCRIPTION_LENGTH) // 256
console.log(VALIDATION_CONSTANTS.MIN_BADGE_LEVEL) // 1
console.log(VALIDATION_CONSTANTS.MAX_BADGE_LEVEL) // 5
```

## Valid Categories

The following badge categories are supported by default:

- `skill` - Technical or professional skills
- `participation` - Event or activity participation
- `contribution` - Community contributions
- `leadership` - Leadership roles or achievements
- `learning` - Learning milestones
- `achievement` - General achievements
- `milestone` - Project or personal milestones

### Custom Categories

You can provide custom categories for validation:

```typescript
const customCategories = ['custom1', 'custom2', 'custom3']

const result = validateBadgeCategory('custom1', customCategories)
// Returns null (valid)

const result2 = validateBadgeMetadata({
  name: 'Custom Badge',
  description: 'A badge with a custom category',
  category: 'custom1',
  level: 2,
  validCategories: customCategories
})
```

## Helper Functions

### getValidBadgeCategories()

Returns the array of valid badge categories.

```typescript
import { getValidBadgeCategories } from '@/lib/validation/badgeValidation'

const categories = getValidBadgeCategories()
// ['skill', 'participation', 'contribution', ...]
```

### isCategoryValid(category)

Checks if a category is valid.

```typescript
import { isCategoryValid } from '@/lib/validation/badgeValidation'

isCategoryValid('skill') // true
isCategoryValid('invalid') // false
```

### isLevelInValidRange(level)

Checks if a level is within the valid range (1-5).

```typescript
import { isLevelInValidRange } from '@/lib/validation/badgeValidation'

isLevelInValidRange(3) // true
isLevelInValidRange(6) // false
isLevelInValidRange(2.5) // false (must be integer)
```

## Error Format

All validation functions return errors in a consistent format:

```typescript
interface ValidationError {
  field: string      // The field that failed validation
  message: string    // User-friendly error message
}

interface BadgeValidationResult {
  valid: boolean                // Whether validation passed
  errors: ValidationError[]     // Array of errors (empty if valid)
}
```

## Testing

The module includes comprehensive unit tests covering all validation scenarios:

```bash
npm run test -- tests/unit/badgeValidation.test.ts
```

## Integration

This validation module is integrated into:

- **BadgeForm.tsx** - Badge template creation form
- **BadgeIssuanceForm.tsx** - Badge issuance form
- **Backend API** - Server-side validation (if applicable)

## Best Practices

1. **Always validate on submission**: Run validation when user submits the form
2. **Clear errors on change**: Clear field errors when user starts typing
3. **Show inline errors**: Display validation errors next to the relevant fields
4. **Provide helpful hints**: Show character limits and format requirements
5. **Validate early**: Consider real-time validation for better UX

## License

Part of the PassportX project.
