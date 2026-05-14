// CommunityBadgeValidator.ts
// Service to validate badge issuance rules for communities

export class CommunityBadgeValidator {
  validateBadgeIssuance(
    communityId: string,
    userId: string,
    badgeId: string
  ): boolean {
    if (!communityId || !userId || !badgeId) {
      return false;
    }
    return communityId.length > 0 && userId.length > 0 && badgeId.length > 0;
  }

  validateBadgeExpiry(expiryDate: Date): boolean {
    return expiryDate > new Date();
  }

  validateBadgeMetadata(metadata: Record<string, unknown>): boolean {
    return Object.keys(metadata).length > 0;
  }
}
