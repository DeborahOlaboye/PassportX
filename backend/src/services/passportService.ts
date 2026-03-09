import Badge from '../models/Badge';
import BadgeTemplate from '../models/BadgeTemplate';
import Community from '../models/Community';
import User from '../models/User';

export const getPublicPassports = async (limit = 10, skip = 0) => {
  const users = await User.find({ isPublic: true })
    .sort({ lastActive: -1 })
    .limit(limit)
    .skip(skip);

  if (users.length === 0) return [];

  const addresses = users.map((u) => u.stacksAddress);

  // Single aggregation: count badges and distinct communities per owner
  const badgeStats: {
    _id: string;
    badgeCount: number;
    communityCount: number;
  }[] = await Badge.aggregate([
    { $match: { owner: { $in: addresses } } },
    {
      $group: {
        _id: '$owner',
        badgeCount: { $sum: 1 },
        communities: { $addToSet: '$community' },
      },
    },
    {
      $project: {
        badgeCount: 1,
        communityCount: { $size: '$communities' },
      },
    },
  ]);

  const statsMap = new Map(badgeStats.map((s) => [s._id, s]));

  // Single query: most recent badge per owner
  const recentBadges: { _id: string; templateName: string | null }[] =
    await Badge.aggregate([
      { $match: { owner: { $in: addresses } } },
      { $sort: { issuedAt: -1 } },
      {
        $group: {
          _id: '$owner',
          templateId: { $first: '$templateId' },
        },
      },
      {
        $lookup: {
          from: 'badgetemplates',
          localField: 'templateId',
          foreignField: '_id',
          as: 'template',
        },
      },
      {
        $project: {
          templateName: {
            $ifNull: [{ $arrayElemAt: ['$template.name', 0] }, null],
          },
        },
      },
    ]);

  const recentMap = new Map(recentBadges.map((r) => [r._id, r.templateName]));

  const passports = users.map((user) => {
    const stats = statsMap.get(user.stacksAddress);
    return {
      userId: user.stacksAddress,
      name: user.name || 'Anonymous User',
      badgeCount: stats?.badgeCount ?? 0,
      communities: stats?.communityCount ?? 0,
      recentBadge: recentMap.get(user.stacksAddress) ?? null,
      avatar: user.avatar,
      joinDate: user.joinDate,
    };
  });

  return passports.filter((passport) => passport.badgeCount > 0);
};

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const searchPassports = async (query: string, limit = 10) => {
  const safeQuery = escapeRegex(query);
  const users = await User.find({
    isPublic: true,
    $or: [
      { name: { $regex: safeQuery, $options: 'i' } },
      { bio: { $regex: safeQuery, $options: 'i' } },
    ],
  }).limit(limit);

  if (users.length === 0) return [];

  const addresses = users.map((u) => u.stacksAddress);

  const badgeStats: {
    _id: string;
    badgeCount: number;
    communityCount: number;
  }[] = await Badge.aggregate([
    { $match: { owner: { $in: addresses } } },
    {
      $group: {
        _id: '$owner',
        badgeCount: { $sum: 1 },
        communities: { $addToSet: '$community' },
      },
    },
    {
      $project: {
        badgeCount: 1,
        communityCount: { $size: '$communities' },
      },
    },
  ]);

  const statsMap = new Map(badgeStats.map((s) => [s._id, s]));

  return users.map((user) => {
    const stats = statsMap.get(user.stacksAddress);
    return {
      userId: user.stacksAddress,
      name: user.name || 'Anonymous User',
      badgeCount: stats?.badgeCount ?? 0,
      communities: stats?.communityCount ?? 0,
      avatar: user.avatar,
    };
  });
};

export const getPassportAnalytics = async (stacksAddress: string) => {
  const badges = await Badge.find({ owner: stacksAddress })
    .populate('templateId')
    .populate('community');

  const categoryStats = badges.reduce((acc, badge) => {
    const category = badge.metadata.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const levelStats = badges.reduce((acc, badge) => {
    const level = badge.metadata.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const communityStats = badges.reduce((acc, badge) => {
    const communityName = (badge.community as any)?.name;
    if (communityName) {
      acc[communityName] = (acc[communityName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return {
    totalBadges: badges.length,
    categoryBreakdown: categoryStats,
    levelBreakdown: levelStats,
    communityBreakdown: communityStats,
    recentActivity: badges
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
      .slice(0, 5)
      .map((badge) => ({
        badgeName: (badge.templateId as any)?.name ?? null,
        community: (badge.community as any)?.name ?? null,
        issuedAt: badge.issuedAt,
      })),
  };
};
