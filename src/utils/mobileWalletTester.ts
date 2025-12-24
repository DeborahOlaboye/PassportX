import { MobileWalletAnalytics, trackMobileWalletConnectionAttempt, trackMobileWalletConnectionSuccess, trackMobileWalletConnectionFailure } from './mobileWalletAnalytics';
import { initiateMobileWalletConnection, waitForMobileWalletResponse } from './mobileWalletResponseHandler';
import { createStacksWalletConfig, createWalletConnectUri, openMobileWallet } from './stacksWalletConnect';

export interface MobileWalletTestResult {
  walletType: 'xverse' | 'hiro' | 'leather';
  success: boolean;
  duration: number;
  error?: string;
  sessionId: string;
  timestamp: number;
}

export interface MobileWalletTestSuite {
  runAllTests: () => Promise<MobileWalletTestResult[]>;
  testWalletConnection: (walletType: 'xverse' | 'hiro' | 'leather') => Promise<MobileWalletTestResult>;
  getTestResults: () => MobileWalletTestResult[];
  clearTestResults: () => void;
}

export class MobileWalletTester implements MobileWalletTestSuite {
  private static instance: MobileWalletTester;
  private testResults: MobileWalletTestResult[] = [];
  private isRunningTests = false;

  private constructor() {}

  public static getInstance(): MobileWalletTester {
    if (!MobileWalletTester.instance) {
      MobileWalletTester.instance = new MobileWalletTester();
    }
    return MobileWalletTester.instance;
  }

  public async runAllTests(): Promise<MobileWalletTestResult[]> {
    if (this.isRunningTests) {
      throw new Error('Tests are already running');
    }

    this.isRunningTests = true;
    const results: MobileWalletTestResult[] = [];

    try {
      const wallets: ('xverse' | 'hiro' | 'leather')[] = ['xverse', 'hiro', 'leather'];

      for (const wallet of wallets) {
        try {
          const result = await this.testWalletConnection(wallet);
          results.push(result);
        } catch (error) {
          console.error(`Failed to test ${wallet}:`, error);
          results.push({
            walletType: wallet,
            success: false,
            duration: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
            sessionId: `test_${Date.now()}`,
            timestamp: Date.now(),
          });
        }
      }
    } finally {
      this.isRunningTests = false;
    }

    return results;
  }

  public async testWalletConnection(walletType: 'xverse' | 'hiro' | 'leather'): Promise<MobileWalletTestResult> {
    const sessionId = `test_${walletType}_${Date.now()}`;
    const startTime = Date.now();

    try {
      // Track connection attempt
      trackMobileWalletConnectionAttempt(walletType, sessionId);

      // Create WalletConnect configuration
      const config = createStacksWalletConfig();
      const sessionTopic = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uri = createWalletConnectUri(sessionTopic, config);

      // Initiate connection (but don't actually open wallet in tests)
      const requestId = initiateMobileWalletConnection(uri, walletType);

      // For testing purposes, we'll simulate a response after a delay
      // In a real test environment, you might want to mock the wallet response
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), 5000); // 5 second timeout for tests
      });

      const responsePromise = waitForMobileWalletResponse(requestId, 5000);

      try {
        await Promise.race([responsePromise, timeoutPromise]);

        // If we get here, the response was successful
        trackMobileWalletConnectionSuccess(walletType, sessionId);

        const result: MobileWalletTestResult = {
          walletType,
          success: true,
          duration: Date.now() - startTime,
          sessionId,
          timestamp: Date.now(),
        };

        this.testResults.push(result);
        return result;

      } catch (responseError) {
        // Response failed or timed out
        const error = responseError instanceof Error ? responseError.message : 'Response failed';
        trackMobileWalletConnectionFailure(walletType, sessionId, error);

        const result: MobileWalletTestResult = {
          walletType,
          success: false,
          duration: Date.now() - startTime,
          error,
          sessionId,
          timestamp: Date.now(),
        };

        this.testResults.push(result);
        return result;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test failed';
      trackMobileWalletConnectionFailure(walletType, sessionId, errorMessage);

      const result: MobileWalletTestResult = {
        walletType,
        success: false,
        duration: Date.now() - startTime,
        error: errorMessage,
        sessionId,
        timestamp: Date.now(),
      };

      this.testResults.push(result);
      return result;
    }
  }

  public getTestResults(): MobileWalletTestResult[] {
    return [...this.testResults];
  }

  public clearTestResults(): void {
    this.testResults = [];
  }

  public getTestSummary(): {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    averageDuration: number;
    successRate: number;
  } {
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;
    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageDuration,
      successRate,
    };
  }

  public exportTestResults(): string {
    const summary = this.getTestSummary();
    const results = {
      summary,
      detailedResults: this.testResults,
      exportTimestamp: Date.now(),
    };

    return JSON.stringify(results, null, 2);
  }
}

// Convenience functions for testing
export const runMobileWalletTests = (): Promise<MobileWalletTestResult[]> => {
  return MobileWalletTester.getInstance().runAllTests();
};

export const testMobileWalletConnection = (walletType: 'xverse' | 'hiro' | 'leather'): Promise<MobileWalletTestResult> => {
  return MobileWalletTester.getInstance().testWalletConnection(walletType);
};

export const getMobileWalletTestResults = (): MobileWalletTestResult[] => {
  return MobileWalletTester.getInstance().getTestResults();
};

export const getMobileWalletTestSummary = () => {
  return MobileWalletTester.getInstance().getTestSummary();
};

// Development helper: Simulate wallet response for testing
export const simulateWalletResponse = (
  requestId: string,
  success: boolean,
  data?: any,
  error?: string
): void => {
  // This is a development helper to simulate wallet responses
  // In production, this would be handled by the actual wallet apps
  const event = new CustomEvent('walletconnect_response', {
    detail: {
      id: requestId,
      success,
      data,
      error,
    },
  });

  window.dispatchEvent(event);
};