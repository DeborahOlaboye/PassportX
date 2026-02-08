# Type Safety Improvements

## Overview

This document describes the type safety improvements made to eliminate unsafe type casting (`as any`) throughout the codebase.

## Changes Made

### 1. User Model Types

**Added to `IUser` interface:**
- `passportId?: string` - Optional passport identifier
- `settings?: IUserSettings` - User privacy settings

**New Interface:**
```typescript
export interface IUserSettings {
  showEmail?: boolean
  showBadges?: boolean
  showCommunities?: boolean
}
```

### 2. Populated Document Types

**Added new types for populated Mongoose documents:**

```typescript
export interface IPopulatedBadge extends Omit<IBadge, 'templateId' | 'community'> {
  templateId: IBadgeTemplate
  community: ICommunity
}

export interface IPopulatedBadgeTemplate extends Omit<IBadgeTemplate, 'community'> {
  community: ICommunity
}
```

These types represent documents after Mongoose `.populate()` calls, where reference fields are replaced with the actual documents.

### 3. Type Guards

**Created type guard utilities in `backend/src/utils/typeGuards.ts`:**

- `isPopulatedBadge()` - Check if badge has populated fields
- `isPopulatedBadgeTemplate()` - Check if template has populated community
- `isCommunity()` - Check if value is a Community document
- `isBadgeTemplate()` - Check if value is a BadgeTemplate document

**Usage Example:**
```typescript
const badge = await Badge.findById(id).populate('templateId').populate('community');

if (isPopulatedBadge(badge)) {
  // TypeScript now knows badge.templateId and badge.community are populated
  console.log(badge.templateId.name);
  console.log(badge.community.name);
}
```

## Files Modified

### Controllers
- `backend/src/controllers/authController.ts`
  - Removed `(user as any).passportId`
  - Now uses `user.passportId` with proper typing

- `backend/src/controllers/userController.ts`
  - Removed `(user as any).settings`
  - Removed `(user as any).passportId`
  - Now uses proper type-safe property access

### Utils
- `backend/src/utils/sessionManager.ts`
  - Removed `(decoded as any)`
  - Now uses `jwt.JwtPayload` type with proper null checking

### Routes
- `backend/src/routes/badges.ts`
  - Removed all `(template.community as any)`
  - Removed all `(badge.templateId as any)`
  - Removed all `(badge.community as any)`
  - Now uses `IPopulatedBadge` and `IPopulatedBadgeTemplate` types

### Models
- `backend/src/models/User.ts`
  - Added `passportId` field to schema
  - Added `settings` field to schema

### Types
- `backend/src/types/index.ts`
  - Added `IUserSettings` interface
  - Extended `IUser` with `passportId` and `settings`
  - Added `IPopulatedBadge` interface
  - Added `IPopulatedBadgeTemplate` interface

## Benefits

1. **Type Safety**: TypeScript can now catch type errors at compile time
2. **Better IDE Support**: Autocomplete and IntelliSense work correctly
3. **Runtime Safety**: Type guards provide runtime validation when needed
4. **Maintainability**: Code is easier to understand and refactor
5. **Bug Prevention**: Eliminates potential runtime errors from accessing non-existent properties

## Migration Guide

### Before (Unsafe)
```typescript
const user = await User.findOne({ stacksAddress });
const hasPassport = !!(user as any).passportId; // Unsafe!
```

### After (Type-Safe)
```typescript
const user = await User.findOne({ stacksAddress });
const hasPassport = !!user.passportId; // Type-safe!
```

### Before (Unsafe)
```typescript
const badge = await Badge.findById(id).populate('templateId');
const name = (badge.templateId as any).name; // Unsafe!
```

### After (Type-Safe)
```typescript
const badge = await Badge.findById(id).populate('templateId') as IPopulatedBadge | null;
if (badge) {
  const name = badge.templateId.name; // Type-safe!
}
```

## Best Practices

1. **Never use `as any`** - It bypasses all type checking
2. **Use proper types** - Define interfaces for all data structures
3. **Use type guards** - For runtime type validation
4. **Type populated documents** - Use specific types after `.populate()`
5. **Check for null/undefined** - Always validate before accessing properties

## Related Issues

- Issue #151: TypeScript: Unsafe Type Casting
