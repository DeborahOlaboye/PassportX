'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function ProfileSettings() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: user?.profile?.name || '',
    bio: user?.profile?.bio || '',
    email: user?.profile?.email || '',
    avatar: user?.profile?.avatar || '',
  });

  const [privacySettings, setPrivacySettings] = useState({
    isPublic: user?.isPublic ?? true,
    showEmail: false,
    showBadges: true,
    showCommunities: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.profile?.name || '',
        bio: user.profile?.bio || '',
        email: user.profile?.email || '',
        avatar: user.profile?.avatar || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/users/${user?.stacksAddress}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privacySettings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Privacy settings updated!' });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update privacy settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stacks Address
            </label>
            <input
              type="text"
              value={user?.stacksAddress || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              id="avatar"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: user?.profile?.name || '',
                    bio: user?.profile?.bio || '',
                    email: user?.profile?.email || '',
                    avatar: user?.profile?.avatar || '',
                  });
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Settings Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Settings</h2>

        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={privacySettings.isPublic}
                onChange={(e) =>
                  setPrivacySettings({ ...privacySettings, isPublic: e.target.checked })
                }
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">Public Profile</p>
                <p className="text-sm text-gray-600">
                  Allow others to view your passport and achievements
                </p>
              </div>
            </label>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={privacySettings.showEmail}
                onChange={(e) =>
                  setPrivacySettings({ ...privacySettings, showEmail: e.target.checked })
                }
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">Show Email Address</p>
                <p className="text-sm text-gray-600">
                  Display your email on your public profile
                </p>
              </div>
            </label>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={privacySettings.showBadges}
                onChange={(e) =>
                  setPrivacySettings({ ...privacySettings, showBadges: e.target.checked })
                }
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">Show Badges</p>
                <p className="text-sm text-gray-600">
                  Display your earned badges on your profile
                </p>
              </div>
            </label>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={privacySettings.showCommunities}
                onChange={(e) =>
                  setPrivacySettings({ ...privacySettings, showCommunities: e.target.checked })
                }
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium text-gray-900">Show Communities</p>
                <p className="text-sm text-gray-600">
                  Display the communities you're a member of
                </p>
              </div>
            </label>
          </div>

          <button
            onClick={handleSavePrivacy}
            disabled={isSaving}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Privacy Settings'}
          </button>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Member Since</p>
              <p className="text-sm text-gray-600">
                {user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Not available'}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Passport Status</p>
              <p className="text-sm text-gray-600">
                {user?.hasPassport ? (
                  <span className="text-green-600">✓ Active</span>
                ) : (
                  <span className="text-yellow-600">⚠ Not initialized</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium text-gray-900">Network</p>
              <p className="text-sm text-gray-600">
                {process.env.NEXT_PUBLIC_STACKS_NETWORK || 'mainnet'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
