'use client';

interface NotificationBadgeProps {
  count: number;
  max?: number;
}

export default function NotificationBadge({ count, max = 99 }: NotificationBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full transform translate-x-1/4 -translate-y-1/4">
      {displayCount}
    </span>
  );
}
