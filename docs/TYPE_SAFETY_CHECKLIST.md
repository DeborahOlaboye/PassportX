# Type Safety Code Review Checklist

Use this checklist when reviewing code to ensure type safety standards are maintained.

## General Type Safety

- [ ] No use of `as any` type casting
- [ ] No use of `@ts-ignore` or `@ts-expect-error` without justification
- [ ] All function parameters have explicit types
- [ ] All function return types are explicitly declared
- [ ] No implicit `any` types

## Mongoose & Database

- [ ] Proper interfaces defined for all Mongoose models
- [ ] Populated documents use appropriate populated types (e.g., `IPopulatedBadge`)
- [ ] Type assertions for populated documents include null checks
- [ ] Database queries handle null/undefined results

## Type Guards

- [ ] Type guards used when runtime type checking is needed
- [ ] Type guards properly validate all required properties
- [ ] Type guards return boolean and use `is` type predicate

## API Responses

- [ ] Response types are properly defined
- [ ] Error responses have consistent structure
- [ ] Optional fields are marked with `?`
- [ ] Required fields are validated before use

## Common Patterns

### ✅ Good
```typescript
// Proper type definition
interface User {
  id: string;
  name?: string;
}

// Type guard usage
if (isPopulatedBadge(badge)) {
  console.log(badge.templateId.name);
}

// Explicit typing for populated documents
const badge = await Badge.findById(id)
  .populate('templateId') as IPopulatedBadge | null;
```

### ❌ Bad
```typescript
// Unsafe type casting
const user = data as any;

// No null check
const badge = await Badge.findById(id);
console.log(badge.templateId.name); // Could be null!

// Implicit any
function process(data) { // data is implicitly any
  return data.value;
}
```

## Before Merging

- [ ] All TypeScript compilation errors resolved
- [ ] ESLint warnings for `any` usage addressed
- [ ] Tests pass with new types
- [ ] Documentation updated if public API changed
- [ ] Migration script created if schema changed

## Questions to Ask

1. Could this property be undefined at runtime?
2. Is this type assertion safe?
3. Should we use a type guard here?
4. Are all edge cases handled?
5. Will this work with existing data?

## Resources

- [Type Safety Improvements Documentation](./TYPE_SAFETY_IMPROVEMENTS.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Type Guards Documentation](../backend/src/utils/typeGuards.ts)
