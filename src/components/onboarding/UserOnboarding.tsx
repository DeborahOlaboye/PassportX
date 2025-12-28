'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to PassportX!',
    description: 'Your digital achievement passport on the Stacks blockchain.',
  },
  {
    id: 2,
    title: 'Connect Your Wallet',
    description: 'Connect your Stacks wallet to get started and create your unique passport.',
  },
  {
    id: 3,
    title: 'Create Your Profile',
    description: 'Tell us about yourself and customize your public profile.',
  },
  {
    id: 4,
    title: 'Privacy Settings',
    description: 'Choose what information you want to share publicly.',
  },
  {
    id: 5,
    title: 'You\'re All Set!',
    description: 'Start earning badges and building your achievement portfolio.',
  },
];

export function UserOnboarding() {
  const { user, isAuthenticated, connectWallet, initializePassport, updateProfile } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    email: '',
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    isPublic: true,
    showEmail: false,
    showBadges: true,
  });

  const handleNext = async () => {
    setIsLoading(true);

    try {
      if (currentStep === 2 && !isAuthenticated) {
        // Connect wallet step
        await connectWallet();
      } else if (currentStep === 3 && user) {
        // Save profile step
        await updateProfile(profileData);
        await initializePassport();
      } else if (currentStep === 4) {
        // Save privacy settings
        await fetch(`/api/users/${user?.stacksAddress}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(privacySettings),
        });
      } else if (currentStep === 5) {
        // Complete onboarding
        if (typeof window !== 'undefined') {
          localStorage.setItem('onboarding_completed', 'true');
        }
        router.push('/passport');
        return;
      }

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Onboarding step failed:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep === 3) {
      // Skip profile creation
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Skip privacy settings and complete onboarding
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_completed', 'true');
      }
      router.push('/passport');
    }
  };

  const currentStepData = ONBOARDING_STEPS.find(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {ONBOARDING_STEPS.map((step) => (
              <div
                key={step.id}
                className={`w-full h-2 rounded-full mx-1 ${
                  step.id <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {currentStep} of {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {currentStepData?.title}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {currentStepData?.description}
          </p>

          {/* Step-specific content */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">What is PassportX?</h3>
                <p className="text-blue-800">
                  PassportX is a digital achievement passport that lives on the Stacks blockchain.
                  Earn badges from communities, showcase your skills, and build a verifiable
                  record of your accomplishments.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="text-sm font-medium">Earn Badges</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl mb-2">🌐</div>
                  <p className="text-sm font-medium">Join Communities</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl mb-2">📜</div>
                  <p className="text-sm font-medium">Build Your Portfolio</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center py-8">
              {!isAuthenticated ? (
                <div>
                  <div className="text-6xl mb-4">🔐</div>
                  <p className="text-gray-600 mb-6">
                    You'll need a Stacks wallet to continue. Don't have one?{' '}
                    <a
                      href="https://www.hiro.so/wallet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Get Hiro Wallet
                    </a>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-green-600 font-medium">Wallet Connected!</p>
                  <p className="text-gray-600 mt-2">Address: {user?.stacksAddress?.slice(0, 12)}...</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
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
                    <p className="font-medium text-gray-900">Make profile public</p>
                    <p className="text-sm text-gray-600">
                      Allow others to view your passport and badges
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
                    <p className="font-medium text-gray-900">Show email address</p>
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
                    <p className="font-medium text-gray-900">Show badges</p>
                    <p className="text-sm text-gray-600">
                      Display your earned badges on your profile
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-xl font-medium text-gray-900 mb-2">
                Your passport has been created!
              </p>
              <p className="text-gray-600">
                You're ready to start earning badges and joining communities.
              </p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <div className="flex gap-2">
            {(currentStep === 3 || currentStep === 4) && (
              <button
                onClick={handleSkip}
                className="px-6 py-2 text-gray-600 hover:text-gray-900"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isLoading || (currentStep === 2 && !isAuthenticated)}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : currentStep === 5 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
