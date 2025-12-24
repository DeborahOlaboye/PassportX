'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Smartphone,
  QrCode,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  duration: number; // in seconds
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'intro',
    title: 'Welcome to Mobile Wallet Connection',
    description: 'Learn how to connect your mobile wallet to PassportX',
    duration: 30,
    content: (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Smartphone className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-gray-600">
          This tutorial will guide you through connecting your mobile wallet to PassportX
          for secure blockchain interactions.
        </p>
      </div>
    ),
  },
  {
    id: 'select-wallet',
    title: 'Choose Your Wallet',
    description: 'Select from popular mobile wallets',
    duration: 45,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          PassportX supports multiple mobile wallets. Choose the one you prefer:
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <div className="text-2xl mb-2">🔷</div>
            <div className="font-medium">Xverse</div>
            <div className="text-sm text-gray-500">Popular choice</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <div className="text-2xl mb-2">🔶</div>
            <div className="font-medium">Hiro</div>
            <div className="text-sm text-gray-500">Official wallet</div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <div className="text-2xl mb-2">🟫</div>
            <div className="font-medium">Leather</div>
            <div className="text-sm text-gray-500">Bitcoin focused</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'generate-qr',
    title: 'Generate QR Code',
    description: 'Create a secure connection code',
    duration: 40,
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <QrCode className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <p className="text-gray-600 text-center">
          Click "Connect Wallet" to generate a QR code. This creates a secure,
          temporary connection link for your mobile wallet.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Security Note</h4>
              <p className="text-sm text-blue-700">
                The QR code contains encrypted connection data and expires after 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'scan-qr',
    title: 'Scan with Mobile Wallet',
    description: 'Use your mobile wallet to scan the QR code',
    duration: 50,
    content: (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <Smartphone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-700 mb-2">Open your mobile wallet app</p>
          <p className="text-sm text-gray-500">Navigate to the WalletConnect or scan section</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Step 1: Open Camera</h4>
            <p className="text-sm text-gray-600">
              Tap the scan or WalletConnect button in your wallet app.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Step 2: Scan QR Code</h4>
            <p className="text-sm text-gray-600">
              Point your camera at the QR code displayed on this screen.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'approve-connection',
    title: 'Approve Connection',
    description: 'Review and approve the connection request',
    duration: 35,
    content: (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Connection Detected</h4>
              <p className="text-sm text-green-700">
                Your mobile wallet has scanned the QR code successfully.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-gray-600">In your mobile wallet, you'll see:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
            <li>PassportX requesting connection</li>
            <li>Requested permissions (read accounts, sign transactions)</li>
            <li>Connection expiry time</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Review Carefully</h4>
              <p className="text-sm text-yellow-700">
                Always verify the connection details match what you expect before approving.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'complete',
    title: 'Connection Complete',
    description: 'Your mobile wallet is now connected',
    duration: 25,
    content: (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-green-900">Successfully Connected!</h3>
        <p className="text-gray-600">
          Your mobile wallet is now securely connected to PassportX.
          You can now interact with blockchain features.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <h4 className="font-medium mb-2">What's Next?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Mint badges and collectibles</li>
            <li>• Participate in communities</li>
            <li>• Sign transactions securely</li>
            <li>• Track your activity</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export default function MobileWalletTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentTutorialStep = TUTORIAL_STEPS[currentStep];
  const totalSteps = TUTORIAL_STEPS.length;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress(0);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setProgress(0);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2">Mobile Wallet Connection Tutorial</h2>
        <p className="text-gray-600 text-center">
          Follow these steps to connect your mobile wallet securely
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {currentTutorialStep.title}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center space-x-2 mb-6">
        {TUTORIAL_STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentStep
                ? 'bg-blue-600'
                : index < currentStep
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`}
            aria-label={`Go to step ${index + 1}: ${step.title}`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-96 flex items-center justify-center mb-6">
        <div className="w-full max-w-2xl">
          {currentTutorialStep.content}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <SkipBack className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>

        <button
          onClick={nextStep}
          disabled={currentStep === totalSteps - 1}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Next
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Step Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>{currentTutorialStep.description}</p>
        <p className="mt-1">Estimated time: {currentTutorialStep.duration} seconds</p>
      </div>
    </div>
  );
}