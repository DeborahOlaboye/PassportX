/**
 * Type-Safe Patterns Examples
 * 
 * This file demonstrates proper type-safe patterns for common operations
 * in the PassportX codebase.
 */

import { IUser, IPopulatedBadge, IPopulatedBadgeTemplate } from '../types';
import { isPopulatedBadge, isPopulatedBadgeTemplate } from '../utils/typeGuards';
import User from '../models/User';
import Badge from '../models/Badge';
import BadgeTemplate from '../models/BadgeTemplate';

// ============================================================================
// Example 1: Accessing User Properties
// ============================================================================

async function getUserPassportStatus(stacksAddress: string): Promise<boolean> {
  const user = await User.findOne({ stacksAddress });
  
  if (!user) {
    return false;
  }
  
  // ✅ Type-safe: passportId is defined in IUser interface
  return !!user.passportId;
}

// ============================================================================
// Example 2: Working with Populated Documents
// ============================================================================

async function getBadgeDetails(badgeId: string) {
  const badge = await Badge.findById(badgeId)
    .populate('templateId')
    .populate('community') as IPopulatedBadge | null;
  
  if (!badge) {
    throw new Error('Badge not found');
  }
  
  // ✅ Type-safe: TypeScript knows templateId and community are populated
  return {
    badgeName: badge.templateId.name,
    communityName: badge.community.name,
    level: badge.metadata.level
  };
}

// ============================================================================
// Example 3: Using Type Guards
// ============================================================================

async function processBadge(badgeId: string) {
  const badge = await Badge.findById(badgeId)
    .populate('templateId')
    .populate('community');
  
  if (!badge) {
    throw new Error('Badge not found');
  }
  
  // ✅ Type-safe: Use type guard for runtime validation
  if (isPopulatedBadge(badge)) {
    console.log(`Badge: ${badge.templateId.name}`);
    console.log(`Community: ${badge.community.name}`);
  } else {
    throw new Error('Badge not properly populated');
  }
}

// ============================================================================
// Example 4: Updating User Settings
// ============================================================================

async function updateUserPrivacy(
  stacksAddress: string,
  showEmail: boolean,
  showBadges: boolean
): Promise<void> {
  const user = await User.findOne({ stacksAddress });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // ✅ Type-safe: settings is defined in IUser interface
  user.settings = {
    showEmail,
    showBadges,
    showCommunities: user.settings?.showCommunities ?? true
  };
  
  await user.save();
}

// ============================================================================
// Example 5: Checking Template Permissions
// ============================================================================

async function canUserEditTemplate(
  templateId: string,
  userAddress: string
): Promise<boolean> {
  const template = await BadgeTemplate.findById(templateId)
    .populate('community') as IPopulatedBadgeTemplate | null;
  
  if (!template) {
    return false;
  }
  
  // ✅ Type-safe: community is populated and has admins array
  return template.community.admins.includes(userAddress);
}

// ============================================================================
// Example 6: Safe Property Access with Optional Chaining
// ============================================================================

async function getUserDisplayName(stacksAddress: string): Promise<string> {
  const user = await User.findOne({ stacksAddress });
  
  // ✅ Type-safe: Use optional chaining for optional properties
  return user?.name ?? user?.stacksAddress ?? 'Anonymous';
}

export {
  getUserPassportStatus,
  getBadgeDetails,
  processBadge,
  updateUserPrivacy,
  canUserEditTemplate,
  getUserDisplayName
};
