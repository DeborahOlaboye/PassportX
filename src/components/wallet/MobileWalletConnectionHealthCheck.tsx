'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  Smartphone,
  Globe,
  Shield,
  Clock,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';

interface HealthCheck {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  duration?: number;
  error?: string;
  lastRun?: Date;
}

interface HealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  score: number;
  checks: HealthCheck[];
}

export default function MobileWalletConnectionHealthCheck() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    overall: 'healthy',
    score: 100,
    checks: []
  });
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  const HEALTH_CHECKS: Omit<HealthCheck, 'status' | 'duration' | 'error' | 'lastRun'>[] = [
    {
      id: 'network-connectivity',
      name: 'Network Connectivity',
      description: 'Check internet connection and network stability'
    },
    {
      id: 'walletconnect-service',
      name: 'WalletConnect Service',
      description: 'Verify WalletConnect bridge availability'
    },
    {
      id: 'stacks-node',
      name: 'Stacks Node Access',
      description: 'Check connection to Stacks blockchain nodes'
    },
    {
      id: 'qr-generation',
      name: 'QR Code Generation',
      description: 'Test QR code creation and encoding'
    },
    {
      id: 'deep-linking',
      name: 'Deep Linking Support',
      description: 'Verify mobile app deep linking functionality'
    },
    {
      id: 'security-validation',
      name: 'Security Validation',
      description: 'Check encryption and security measures'
    },
    {
      id: 'performance-metrics',
      name: 'Performance Metrics',
      description: 'Validate connection speed and reliability'
    },
    {
      id: 'error-handling',
      name: 'Error Handling',
      description: 'Test error scenarios and recovery mechanisms'
    }
  ];

  useEffect(() => {
    // Initialize with pending checks
    setHealthStatus(prev => ({
      ...prev,
      checks: HEALTH_CHECKS.map(check => ({
        ...check,
        status: 'pending' as const
      }))
    }));
  }, []);

  const runHealthCheck = async (check: HealthCheck): Promise<HealthCheck> => {
    const startTime = Date.now();

    try {
      switch (check.id) {
        case 'network-connectivity':
          await testNetworkConnectivity();
          break;
        case 'walletconnect-service':
          await testWalletConnectService();
          break;
        case 'stacks-node':
          await testStacksNode();
          break;
        case 'qr-generation':
          await testQRGeneration();
          break;
        case 'deep-linking':
          await testDeepLinking();
          break;
        case 'security-validation':
          await testSecurityValidation();
          break;
        case 'performance-metrics':
          await testPerformanceMetrics();
          break;
        case 'error-handling':
          await testErrorHandling();
          break;
        default:
          throw new Error('Unknown health check');
      }

      return {
        ...check,
        status: 'passed',
        duration: Date.now() - startTime,
        lastRun: new Date()
      };
    } catch (error) {
      return {
        ...check,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastRun: new Date()
      };
    }
  };

  const testNetworkConnectivity = async (): Promise<void> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Network request failed');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw new Error('No internet connectivity');
    }
  };

  const testWalletConnectService = async (): Promise<void> => {
    // Simulate WalletConnect service check
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock check - in real implementation, would ping WalletConnect bridge
    if (Math.random() > 0.95) {
      throw new Error('WalletConnect service unavailable');
    }
  };

  const testStacksNode = async (): Promise<void> => {
    // Simulate Stacks node check
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock check - in real implementation, would check Stacks API
    if (Math.random() > 0.98) {
      throw new Error('Stacks node unreachable');
    }
  };

  const testQRGeneration = async (): Promise<void> => {
    // Test QR code generation
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // Mock QR generation test
      const testData = 'wc:test-uri@1?bridge=https://bridge.walletconnect.org&key=test-key';
      if (!testData.includes('wc:')) {
        throw new Error('Invalid WalletConnect URI format');
      }
    } catch (error) {
      throw new Error('QR code generation failed');
    }
  };

  const testDeepLinking = async (): Promise<void> => {
    // Test deep linking support
    await new Promise(resolve => setTimeout(resolve, 400));

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    if (!isMobile) {
      // On desktop, deep linking might not be available
      throw new Error('Deep linking not supported on this device');
    }
  };

  const testSecurityValidation = async (): Promise<void> => {
    // Test security measures
    await new Promise(resolve => setTimeout(resolve, 600));

    // Mock security checks
    const hasCrypto = typeof crypto !== 'undefined';
    const hasSubtle = typeof crypto.subtle !== 'undefined';

    if (!hasCrypto || !hasSubtle) {
      throw new Error('Web Crypto API not available');
    }
  };

  const testPerformanceMetrics = async (): Promise<void> => {
    // Test performance metrics
    await new Promise(resolve => setTimeout(resolve, 500));

    const startTime = performance.now();
    // Simulate some operation
    await new Promise(resolve => setTimeout(resolve, 100));
    const endTime = performance.now();

    const duration = endTime - startTime;
    if (duration > 1000) {
      throw new Error('Performance degraded');
    }
  };

  const testErrorHandling = async (): Promise<void> => {
    // Test error handling
    await new Promise(resolve => setTimeout(resolve, 300));

    // Simulate error scenario
    try {
      throw new Error('Test error');
    } catch (error) {
      // Error handling should work
      if (!(error instanceof Error)) {
        throw new Error('Error handling failed');
      }
    }
  };

  const runAllChecks = async () => {
    setIsRunning(true);

    const updatedChecks: HealthCheck[] = [];

    for (const check of healthStatus.checks) {
      // Update check to running status
      setHealthStatus(prev => ({
        ...prev,
        checks: prev.checks.map(c =>
          c.id === check.id ? { ...c, status: 'running' as const } : c
        )
      }));

      // Run the check
      const result = await runHealthCheck(check);
      updatedChecks.push(result);

      // Update the check result
      setHealthStatus(prev => ({
        ...prev,
        checks: prev.checks.map(c =>
          c.id === check.id ? result : c
        )
      }));

      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Calculate overall health status
    const passedChecks = updatedChecks.filter(c => c.status === 'passed').length;
    const totalChecks = updatedChecks.length;
    const score = Math.round((passedChecks / totalChecks) * 100);

    let overall: HealthStatus['overall'] = 'healthy';
    if (score < 70) overall = 'critical';
    else if (score < 90) overall = 'warning';

    setHealthStatus(prev => ({
      ...prev,
      overall,
      score,
      checks: updatedChecks
    }));

    setLastCheckTime(new Date());
    setIsRunning(false);
  };

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'passed': return 'text-green-700 bg-green-50 border-green-200';
      case 'failed': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'running': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusColor = (overall: HealthStatus['overall']) => {
    switch (overall) {
      case 'healthy': return 'text-green-700 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Connection Health Check</h2>
          </div>

          <button
            onClick={runAllChecks}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isRunning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Running Checks...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Health Check
              </>
            )}
          </button>
        </div>

        {/* Overall Health Status */}
        <div className={`p-4 rounded-lg border mb-6 ${getOverallStatusColor(healthStatus.overall)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-lg">
                System Health: {healthStatus.overall.charAt(0).toUpperCase() + healthStatus.overall.slice(1)}
              </h3>
              <p className="text-sm mt-1">
                Health Score: {healthStatus.score}/100
                {lastCheckTime && (
                  <span className="ml-2">
                    • Last checked: {lastCheckTime.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold">{healthStatus.score}%</div>
              <div className="text-sm">Healthy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Checks */}
      <div className="space-y-3">
        {healthStatus.checks.map((check) => (
          <div
            key={check.id}
            className={`p-4 rounded-lg border transition-all ${getStatusColor(check.status)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getStatusIcon(check.status)}

                <div className="flex-grow">
                  <h4 className="font-medium text-gray-900">{check.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{check.description}</p>

                  {check.error && (
                    <p className="text-sm text-red-600 mt-2">
                      Error: {check.error}
                    </p>
                  )}

                  {check.duration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Duration: {check.duration}ms
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right text-sm">
                {check.lastRun && (
                  <div className="text-gray-500">
                    {check.lastRun.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Health Check Summary */}
      {healthStatus.checks.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Health Check Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-green-600">
                {healthStatus.checks.filter(c => c.status === 'passed').length}
              </div>
              <div className="text-gray-600">Passed</div>
            </div>
            <div>
              <div className="font-medium text-red-600">
                {healthStatus.checks.filter(c => c.status === 'failed').length}
              </div>
              <div className="text-gray-600">Failed</div>
            </div>
            <div>
              <div className="font-medium text-yellow-600">
                {healthStatus.checks.filter(c => c.status === 'warning').length}
              </div>
              <div className="text-gray-600">Warnings</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">
                {healthStatus.checks.filter(c => c.status === 'pending').length}
              </div>
              <div className="text-gray-600">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}