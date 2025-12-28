export interface EnvironmentValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export function validateWalletConnectEnv(): EnvironmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    errors.push('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
  } else if (projectId === 'default_project_id' || projectId.length < 10) {
    warnings.push('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID looks invalid or is placeholder');
  }

  const relayUrl = process.env.NEXT_PUBLIC_WALLETCONNECT_RELAY_URL;
  if (relayUrl && !relayUrl.startsWith('wss://')) {
    warnings.push('NEXT_PUBLIC_WALLETCONNECT_RELAY_URL should be a secure WebSocket URL (wss://)');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !appUrl.startsWith('http')) {
    warnings.push('NEXT_PUBLIC_APP_URL should be a valid URL');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function logEnvironmentValidation(): void {
  const validation = validateWalletConnectEnv();

  if (typeof window === 'undefined') return;

  const hasIssues = validation.errors.length > 0 || validation.warnings.length > 0;

  if (!hasIssues) {
    console.log('%c✅ WalletConnect environment is properly configured', 'color: green; font-weight: bold');
    return;
  }

  console.group('%c⚠️ WalletConnect Environment Validation', 'color: orange; font-weight: bold');

  if (validation.errors.length > 0) {
    console.error('Errors:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.warn('Warnings:');
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  console.log(
    'Required variables:',
    {
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      NEXT_PUBLIC_WALLETCONNECT_RELAY_URL: process.env.NEXT_PUBLIC_WALLETCONNECT_RELAY_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    }
  );

  console.groupEnd();
}

export function getRequiredEnvVariables(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_WALLETCONNECT_RELAY_URL: process.env.NEXT_PUBLIC_WALLETCONNECT_RELAY_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
}

export function throwIfInvalidEnv(): void {
  const validation = validateWalletConnectEnv();
  if (!validation.isValid) {
    throw new Error(
      `WalletConnect environment validation failed:\n${validation.errors.join('\n')}`
    );
  }
}
