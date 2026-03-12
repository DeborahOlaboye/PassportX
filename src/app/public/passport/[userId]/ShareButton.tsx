'use client';

import { Share2 } from 'lucide-react';

export function ShareButton({ name }: { name: string }) {
  const handleShare = async () => {
    const shareData = {
      title: `${name}'s PassportX Achievement Passport`,
      text: `Check out ${name}'s achievements on PassportX!`,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
    >
      <Share2 className="w-4 h-4" />
      <span>Share</span>
    </button>
  );
}
