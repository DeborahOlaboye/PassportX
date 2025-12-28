'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Smartphone,
  Bell,
  Shield,
  Clock,
  Wifi,
  Save,
  RotateCcw
} from 'lucide-react';

interface MobileWalletSettings {
  autoConnect: boolean;
  enableNotifications: boolean;
  connectionTimeout: number; // seconds
  enableHapticFeedback: boolean;
  enableAnalytics: boolean;
  preferredWallets: ('xverse' | 'hiro' | 'leather')[];
  enableOfflineMode: boolean;
  maxRetryAttempts: number;
  enableBiometricAuth: boolean;
}

const DEFAULT_SETTINGS: MobileWalletSettings = {
  autoConnect: false,
  enableNotifications: true,
  connectionTimeout: 300, // 5 minutes
  enableHapticFeedback: true,
  enableAnalytics: true,
  preferredWallets: ['xverse', 'hiro', 'leather'],
  enableOfflineMode: false,
  maxRetryAttempts: 3,
  enableBiometricAuth: false,
};

const WALLET_OPTIONS = [
  { id: 'xverse' as const, name: 'Xverse', icon: '🔷' },
  { id: 'hiro' as const, name: 'Hiro Wallet', icon: '🔶' },
  { id: 'leather' as const, name: 'Leather', icon: '🟫' },
];

export default function MobileWalletSettingsComponent() {
  const [settings, setSettings] = useState<MobileWalletSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mobileWalletSettings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to load wallet settings:', error);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    const stored = localStorage.getItem('mobileWalletSettings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
        const changed = JSON.stringify(settings) !== JSON.stringify(currentSettings);
        setHasChanges(changed);
      } catch (error) {
        setHasChanges(true);
      }
    } else {
      setHasChanges(JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS));
    }
  }, [settings]);

  const updateSetting = <K extends keyof MobileWalletSettings>(
    key: K,
    value: MobileWalletSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('mobileWalletSettings', JSON.stringify(settings));
      setHasChanges(false);
      // Show success message
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem('mobileWalletSettings');
      setHasChanges(false);
    }
  };

  const toggleWalletPreference = (walletId: 'xverse' | 'hiro' | 'leather') => {
    const newPreferred = settings.preferredWallets.includes(walletId)
      ? settings.preferredWallets.filter(id => id !== walletId)
      : [...settings.preferredWallets, walletId];
    updateSetting('preferredWallets', newPreferred);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Mobile Wallet Settings</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition-colors ${
              hasChanges && !isSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Connection Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Connection Settings
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Auto-connect on app launch</label>
                <p className="text-sm text-gray-600">Automatically attempt to connect to your last used wallet</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoConnect}
                  onChange={(e) => updateSetting('autoConnect', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Connection timeout</label>
                <p className="text-sm text-gray-600">Maximum time to wait for wallet connection</p>
              </div>
              <select
                value={settings.connectionTimeout}
                onChange={(e) => updateSetting('connectionTimeout', parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={60}>1 minute</option>
                <option value={180}>3 minutes</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Maximum retry attempts</label>
                <p className="text-sm text-gray-600">Number of times to retry failed connections</p>
              </div>
              <select
                value={settings.maxRetryAttempts}
                onChange={(e) => updateSetting('maxRetryAttempts', parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={1}>1 attempt</option>
                <option value={3}>3 attempts</option>
                <option value={5}>5 attempts</option>
                <option value={10}>10 attempts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Connection notifications</label>
                <p className="text-sm text-gray-600">Show notifications for connection status changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => updateSetting('enableNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* UX Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Shield className="w-5 h-5" />
            User Experience
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Haptic feedback</label>
                <p className="text-sm text-gray-600">Vibrate device on connection events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableHapticFeedback}
                  onChange={(e) => updateSetting('enableHapticFeedback', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Biometric authentication</label>
                <p className="text-sm text-gray-600">Use fingerprint/face ID for wallet access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableBiometricAuth}
                  onChange={(e) => updateSetting('enableBiometricAuth', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Analytics
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Analytics tracking</label>
                <p className="text-sm text-gray-600">Help improve the app by sharing usage data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAnalytics}
                  onChange={(e) => updateSetting('enableAnalytics', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Offline mode</label>
                <p className="text-sm text-gray-600">Allow limited functionality without internet</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableOfflineMode}
                  onChange={(e) => updateSetting('enableOfflineMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Preferred Wallets */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Preferred Wallets
          </h3>

          <div className="space-y-2">
            {WALLET_OPTIONS.map((wallet) => (
              <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <span className="font-medium">{wallet.name}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.preferredWallets.includes(wallet.id)}
                    onChange={() => toggleWalletPreference(wallet.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Indicator */}
      {hasChanges && (
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            You have unsaved changes. Click "Save" to apply your settings.
          </p>
        </div>
      )}
    </div>
  );
}