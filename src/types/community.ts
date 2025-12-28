export interface Community {
  id: number;
  name: string;
  description: string;
  owner: string;
  active: boolean;
  createdAt: number;
  theme: CommunityTheme;
  settings: CommunitySettings;
}

export interface CommunityTheme {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  banner?: string;
}

export interface CommunitySettings {
  publicBadges: boolean;
  allowMemberRequests: boolean;
  requireApproval: boolean;
}

export interface CommunityMember {
  address: string;
  role: 'admin' | 'issuer' | 'moderator' | 'member';
  joinedAt: number;
}

export interface BadgeTemplate {
  id: number;
  communityId: number;
  name: string;
  description: string;
  category: number;
  level: number;
  icon?: string;
  metadata: Record<string, any>;
}
