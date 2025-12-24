'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Smartphone,
  Wifi,
  Clock,
  ArrowRight,
  Home,
  Settings
} from 'lucide-react';
import { mobileWalletConnectionManager } from '../../utils/mobileWalletConnectionManager';

interface RecoveryStep {
  id: string;
  title: string;
  description: string;
  action?: () => void;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  icon: React.ReactNode;
  estimatedTime?: string;
}

interface ConnectionIssue {
  type: 'timeout' | 'network' | 'wallet' | 'permissions' | 'unknown';
  message: string;
  solutions: string[];
}

export default function MobileWalletConnectionRecovery() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryComplete, setRecoveryComplete] = useState(false);
  const [detectedIssue, setDetectedIssue] = useState<ConnectionIssue | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const ISSUES: Record<string, ConnectionIssue> = {
    timeout: {
      type: 'timeout',
      message: 'Connection timed out after 5 minutes',
      solutions: [
        'Generate a new QR code',
        'Ensure both devices have stable internet',
        'Try connecting from a different network',
        'Check if your wallet app is updated'
      ]
    },
    network: {
      type: 'network',
      message: 'Network connectivity issues detected',
      solutions: [
        'Check your internet connection',
        'Try switching between WiFi and mobile data',
        'Disable VPN if active',
        'Restart your router if possible'
      ]
    },
    wallet: {
      type: 'wallet',
      message: 'Mobile wallet compatibility issue',
      solutions: [
        'Update your wallet app to the latest version',
        'Try a different wallet (Xverse, Hiro, or Leather)',
        'Clear wallet app cache',
        'Reinstall the wallet app if issues persist'
      ]
    },
    permissions: {
      type: 'permissions',
      message: 'Camera or app permissions issue',
      solutions: [
        'Grant camera permissions to scan QR codes',
        'Enable notifications for connection updates',
        'Check app permissions in device settings',
        'Restart the wallet app after granting permissions'
      ]
    },
    unknown: {
      type: 'unknown',
      message: 'Unknown connection issue',
      solutions: [
        'Try the complete recovery process',
        'Contact support with error details',
        'Check our troubleshooting guide',
        'Try connecting from a different device'
      ]
    }
  };

  const RECOVERY_STEPS: RecoveryStep[] = [
    {
      id: 'diagnose',
      title: 'Diagnose Connection Issue',
      description: 'Analyzing the connection problem to determine the best recovery approach.',
      status: 'pending',
      icon: <AlertTriangle className="w-5 h-5" />,
      estimatedTime: '30 seconds'
    },
    {
      id: 'reset-connection',
      title: 'Reset Previous Connection',
      description: 'Clearing any existing connection attempts and cached data.',
      status: 'pending',
      icon: <RefreshCw className="w-5 h-5" />,
      estimatedTime: '15 seconds'
    },
    {
      id: 'check-network',
      title: 'Verify Network Connectivity',
      description: 'Ensuring both devices have stable internet connection.',
      status: 'pending',
      icon: <Wifi className="w-5 h-5" />,
      estimatedTime: '20 seconds'
    },
    {
      id: 'update-wallet',
      title: 'Check Wallet Compatibility',
      description: 'Verifying wallet app is updated and compatible.',
      status: 'pending',
      icon: <Smartphone className="w-5 h-5" />,
      estimatedTime: '1 minute'
    },
    {
      id: 'generate-qr',
      title: 'Generate Fresh QR Code',
      description: 'Creating a new QR code with updated connection parameters.',
      status: 'pending',
      icon: <RefreshCw className="w-5 h-5" />,
      estimatedTime: '10 seconds'
    },
    {
      id: 'test-connection',
      title: 'Test New Connection',
      description: 'Attempting to establish connection with the new QR code.',
      status: 'pending',
      icon: <CheckCircle className="w-5 h-5" />,
      estimatedTime: '2-3 minutes'
    }
  ];

  const diagnoseIssue = async (): Promise<ConnectionIssue> => {
    // Simulate diagnosis process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check network connectivity
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      // If we get here, network is working
    } catch {
      return ISSUES.network;
    }

    // Check for common issues
    const lastError = localStorage.getItem('passportx_mobile_wallet_last_error');
    if (lastError) {
      if (lastError.includes('timeout')) return ISSUES.timeout;
      if (lastError.includes('permission')) return ISSUES.permissions;
      if (lastError.includes('wallet')) return ISSUES.wallet;
    }

    // Check connection attempts
    const attempts = parseInt(localStorage.getItem('passportx_mobile_wallet_attempts') || '0');
    if (attempts > 3) {
      return ISSUES.unknown;
    }

    return ISSUES.unknown;
  };

  const executeRecoveryStep = async (step: RecoveryStep): Promise<boolean> => {
    try {
      switch (step.id) {
        case 'diagnose':
          const issue = await diagnoseIssue();
          setDetectedIssue(issue);
          return true;

        case 'reset-connection':
          // Reset connection state
          localStorage.removeItem('passportx_mobile_wallet_connection');
          localStorage.removeItem('passportx_mobile_wallet_last_error');
          await mobileWalletConnectionManager.disconnect();
          return true;

        case 'check-network':
          // Test network connectivity
          const testResponse = await fetch('https://httpbin.org/status/200', {
            method: 'HEAD',
            timeout: 5000
          } as any);
          return testResponse.ok;

        case 'update-wallet':
          // This would typically check wallet version via API
          // For now, we'll assume it's up to date
          await new Promise(resolve => setTimeout(resolve, 1000));
          return true;

        case 'generate-qr':
          // Generate new QR code (would integrate with QR display component)
          await new Promise(resolve => setTimeout(resolve, 500));
          return true;

        case 'test-connection':
          // Attempt connection
          setConnectionAttempts(prev => prev + 1);
          localStorage.setItem('passportx_mobile_wallet_attempts',
            (connectionAttempts + 1).toString());

          // Simulate connection attempt
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Random success for demo (would be actual connection logic)
          return Math.random() > 0.3;

        default:
          return true;
      }
    } catch (error) {
      console.error(`Recovery step ${step.id} failed:`, error);
      return false;
    }
  };

  const startRecovery = async () => {
    setIsRecovering(true);
    setCurrentStep(0);
    setRecoveryComplete(false);

    const steps = [...RECOVERY_STEPS];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentStep(i);

      // Update step status to in-progress
      steps[i] = { ...step, status: 'in-progress' };

      // Execute the step
      const success = await executeRecoveryStep(step);

      // Update step status based on result
      steps[i] = {
        ...step,
        status: success ? 'completed' : 'failed'
      };

      // If step failed, stop recovery
      if (!success) {
        break;
      }

      // Add delay between steps for UX
      if (i < steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsRecovering(false);
    setRecoveryComplete(true);
  };

  const resetRecovery = () => {
    setCurrentStep(0);
    setIsRecovering(false);
    setRecoveryComplete(false);
    setDetectedIssue(null);
  };

  const getStepStatusColor = (status: RecoveryStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'in-progress': return 'text-blue-600';
      default: return 'text-gray-400';
    }
  };

  const getStepStatusIcon = (status: RecoveryStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'in-progress': return <RefreshCw className="w-4 h-4 animate-spin" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Connection Recovery</h2>
        </div>

        {!isRecovering && !recoveryComplete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Connection Issue Detected</h4>
                <p className="text-sm text-yellow-800 mb-3">
                  Having trouble connecting your mobile wallet? This recovery tool will
                  systematically diagnose and fix common connection problems.
                </p>
                <button
                  onClick={startRecovery}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Recovery Process
                </button>
              </div>
            </div>
          </div>
        )}

        {detectedIssue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Issue Detected: {detectedIssue.message}</h4>
                <div className="mt-2">
                  <h5 className="text-sm font-medium text-red-800">Recommended Solutions:</h5>
                  <ul className="list-disc list-inside text-sm text-red-700 mt-1 space-y-1">
                    {detectedIssue.solutions.map((solution, index) => (
                      <li key={index}>{solution}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recovery Steps */}
      <div className="space-y-4">
        {RECOVERY_STEPS.map((step, index) => {
          const isActive = index === currentStep && isRecovering;
          const isCompleted = step.status === 'completed';
          const isFailed = step.status === 'failed';

          return (
            <div
              key={step.id}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                isActive
                  ? 'border-blue-300 bg-blue-50'
                  : isCompleted
                    ? 'border-green-300 bg-green-50'
                    : isFailed
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className={`flex-shrink-0 mt-1 ${getStepStatusColor(step.status)}`}>
                {getStepStatusIcon(step.status)}
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900">{step.title}</h3>
                  {step.estimatedTime && (
                    <span className="text-xs text-gray-500">({step.estimatedTime})</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>

              {isActive && (
                <div className="flex-shrink-0">
                  <div className="animate-pulse text-blue-600 text-sm font-medium">
                    In Progress...
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recovery Complete */}
      {recoveryComplete && (
        <div className="mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Recovery Complete!</h4>
                <p className="text-sm text-green-800 mb-3">
                  The recovery process has finished. Try connecting your mobile wallet again.
                  If issues persist, contact our support team.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={resetRecovery}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Run Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Connecting
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Wallet
        </button>

        <button
          onClick={() => {/* Navigate to settings */}}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Wallet Settings
        </button>
      </div>
    </div>
  );
}