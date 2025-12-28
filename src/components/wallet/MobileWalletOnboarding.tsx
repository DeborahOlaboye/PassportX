'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  ExternalLink,
  Star,
  Clock
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  estimatedTime: string;
  completed?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'choose-wallet',
    title: 'Choose Your Mobile Wallet',
    description: 'Select a compatible mobile wallet for Stacks blockchain',
    estimatedTime: '1 minute',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          PassportX works with popular mobile wallets that support the Stacks blockchain.
          Choose the wallet that best fits your needs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔷</span>
              <div>
                <div className="font-medium">Xverse</div>
                <div className="text-sm text-gray-500">Recommended</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Popular wallet with excellent Stacks support and user-friendly interface.
            </p>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">4.8/5 rating</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔶</span>
              <div>
                <div className="font-medium">Hiro Wallet</div>
                <div className="text-sm text-gray-500">Official</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Official Stacks wallet developed by Hiro Systems.
            </p>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">4.6/5 rating</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🟫</span>
              <div>
                <div className="font-medium">Leather</div>
                <div className="text-sm text-gray-500">Alternative</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Feature-rich wallet with advanced Stacks capabilities.
            </p>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">4.5/5 rating</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Download Links</h4>
              <div className="mt-2 space-y-2">
                <a
                  href="https://www.xverse.app/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Download Xverse Wallet
                </a>
                <a
                  href="https://wallet.hiro.so"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Download Hiro Wallet
                </a>
                <a
                  href="https://leather.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Download Leather Wallet
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'install-wallet',
    title: 'Install & Set Up Wallet',
    description: 'Download and configure your chosen mobile wallet',
    estimatedTime: '3 minutes',
    content: (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Installation Complete</h4>
              <p className="text-sm text-green-800">
                Great! You've chosen your wallet. Now let's get it set up properly.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Step 1: Create or Import Account</h4>
            <p className="text-sm text-gray-600 mb-3">
              When you open the wallet app for the first time, you'll need to create a new account
              or import an existing one.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                <strong>Security Tip:</strong> Write down your recovery phrase and store it securely.
                Never share it with anyone.
              </p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Step 2: Enable Camera Permissions</h4>
            <p className="text-sm text-gray-600 mb-3">
              Mobile wallet connection requires camera access to scan QR codes.
              Make sure to grant camera permissions when prompted.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Smartphone className="w-4 h-4" />
              <span>Camera access is required for QR code scanning</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Step 3: Test Wallet Functionality</h4>
            <p className="text-sm text-gray-600 mb-3">
              Before connecting to PassportX, make sure your wallet can receive STX and view balances.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <QrCode className="w-4 h-4" />
              <span>Test receiving a small amount of STX to verify everything works</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'connect-wallet',
    title: 'Connect to PassportX',
    description: 'Link your mobile wallet to PassportX using WalletConnect',
    estimatedTime: '2 minutes',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Now that your wallet is set up, let's connect it to PassportX.
          This process is secure and only requires scanning a QR code.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <QrCode className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Connection Process</h4>
              <ol className="mt-2 text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Click "Connect Mobile Wallet" in PassportX</li>
                <li>Scan the QR code with your mobile wallet</li>
                <li>Review and approve the connection in your wallet</li>
                <li>You're connected! Start using PassportX features</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-green-700">What You'll See</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• QR code appears on screen</li>
              <li>• Connection status updates</li>
              <li>• Success confirmation</li>
              <li>• Wallet address display</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-orange-700">What Your Wallet Shows</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Connection request from PassportX</li>
              <li>• Requested permissions</li>
              <li>• Approve/Deny buttons</li>
              <li>• Connection confirmation</li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Connection Timeout</h4>
              <p className="text-sm text-yellow-800">
                QR codes expire after 5 minutes for security. If it times out,
                simply generate a new QR code.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'explore-features',
    title: 'Explore PassportX Features',
    description: 'Discover what you can do with your connected mobile wallet',
    estimatedTime: '5 minutes',
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Congratulations! Your mobile wallet is now connected to PassportX.
          Here are some key features you can explore.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Badge Management</h4>
            <p className="text-sm text-gray-600 mb-3">
              View, manage, and interact with your blockchain badges and credentials.
            </p>
            <div className="text-sm text-blue-600">• View badge collection</div>
            <div className="text-sm text-blue-600">• Transfer badges</div>
            <div className="text-sm text-blue-600">• Verify authenticity</div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Community Features</h4>
            <p className="text-sm text-gray-600 mb-3">
              Participate in communities and manage your social blockchain presence.
            </p>
            <div className="text-sm text-blue-600">• Join communities</div>
            <div className="text-sm text-blue-600">• View member badges</div>
            <div className="text-sm text-blue-600">• Community governance</div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Transaction History</h4>
            <p className="text-sm text-gray-600 mb-3">
              Monitor your blockchain activity and transaction history.
            </p>
            <div className="text-sm text-blue-600">• View all transactions</div>
            <div className="text-sm text-blue-600">• Filter by type</div>
            <div className="text-sm text-blue-600">• Export history</div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Security & Settings</h4>
            <p className="text-sm text-gray-600 mb-3">
              Manage your connection settings and security preferences.
            </p>
            <div className="text-sm text-blue-600">• Connection settings</div>
            <div className="text-sm text-blue-600">• Privacy controls</div>
            <div className="text-sm text-blue-600">• Disconnect wallet</div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">You're All Set!</h4>
              <p className="text-sm text-green-800 mb-2">
                Your mobile wallet is connected and ready to use. Start exploring PassportX features
                and discover the power of blockchain credentials.
              </p>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                Start Exploring PassportX
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export default function MobileWalletOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps = ONBOARDING_STEPS.map((step, index) => ({
    ...step,
    completed: completedSteps.has(index)
  }));

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const nextStep = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Mobile Wallet Quick Start</h2>
        </div>

        <p className="text-gray-600">
          Get up and running with mobile wallet connections in just a few minutes.
          Follow this guided setup to connect your wallet to PassportX.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                  index <= currentStep
                    ? step.completed
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                onClick={() => goToStep(index)}
              >
                {step.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          {steps.map((step, index) => (
            <div key={step.id} className="text-center max-w-24">
              <div className="font-medium">{step.title}</div>
              <div className="text-xs">{step.estimatedTime}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h3>
          <p className="text-gray-600">{currentStepData.description}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          {currentStepData.content}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={isFirstStep}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isFirstStep
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="text-sm text-gray-600">
          Step {currentStep + 1} of {steps.length}
        </div>

        <button
          onClick={nextStep}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {isLastStep ? 'Complete Setup' : 'Next'}
          {!isLastStep && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Skip Option */}
      {!isLastStep && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setCurrentStep(steps.length - 1)}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Skip to end
          </button>
        </div>
      )}
    </div>
  );
}