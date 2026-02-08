import { ICommunity, IBadgeTemplate, IPopulatedBadge, IPopulatedBadgeTemplate } from '../types';

/**
 * Type guard to check if a badge has populated fields
 */
export function isPopulatedBadge(badge: any): badge is IPopulatedBadge {
  return (
    badge &&
    typeof badge.templateId === 'object' &&
    badge.templateId !== null &&
    'name' in badge.templateId &&
    typeof badge.community === 'object' &&
    badge.community !== null &&
    'name' in badge.community
  );
}

/**
 * Type guard to check if a badge template has populated community
 */
export function isPopulatedBadgeTemplate(template: any): template is IPopulatedBadgeTemplate {
  return (
    template &&
    typeof template.community === 'object' &&
    template.community !== null &&
    'admins' in template.community
  );
}

/**
 * Type guard to check if value is a Community document
 */
export function isCommunity(value: any): value is ICommunity {
  return (
    value &&
    typeof value === 'object' &&
    'name' in value &&
    'admins' in value &&
    Array.isArray(value.admins)
  );
}

/**
 * Type guard to check if value is a BadgeTemplate document
 */
export function isBadgeTemplate(value: any): value is IBadgeTemplate {
  return (
    value &&
    typeof value === 'object' &&
    'name' in value &&
    'description' in value &&
    'level' in value &&
    'category' in value
  );
}
