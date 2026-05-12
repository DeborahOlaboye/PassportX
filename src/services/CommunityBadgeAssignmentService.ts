// CommunityBadgeAssignmentService.ts
// Service to handle assigning badges to community members

export class CommunityBadgeAssignmentService {
  private assignments: Map<string, string[]> = new Map();

  assignBadge(communityId: string, userId: string, badgeId: string): boolean {
    if (!this.assignments.has(communityId)) {
      this.assignments.set(communityId, []);
    }
    const badges = this.assignments.get(communityId)!;
    if (!badges.includes(badgeId)) {
      badges.push(badgeId);
      return true;
    }
    return false;
  }

  getAssignedBadges(communityId: string, userId: string): string[] {
    return this.assignments.get(communityId) || [];
  }

  removeBadge(communityId: string, userId: string, badgeId: string): boolean {
    const badges = this.assignments.get(communityId);
    if (badges) {
      const index = badges.indexOf(badgeId);
      if (index > -1) {
        badges.splice(index, 1);
        return true;
      }
    }
    return false;
  }
}
