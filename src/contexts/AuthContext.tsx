'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { apiClient, APIClientError } from '@/lib/api-client';
import logger from '@/utils/logger';

interface User {
  stacksAddress: string;
  profile?: {
    name?: string;
    bio?: string;
    avatar?: string;
    email?: string;
  };
  isPublic: boolean;
  hasPassport: boolean;
  joinDate?: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userSession: UserSession;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateProfile: (profile: Partial<User['profile']>) => Promise<void>;
  initializePassport: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already signed in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (userSession.isUserSignedIn()) {
          const walletData = userSession.loadUserData();
          const stacksAddress =
            walletData.profile.stxAddress.testnet ||
            walletData.profile.stxAddress.mainnet;

          // Fetch user data from backend
          try {
            const userData = await apiClient.get<Record<string, unknown>>(
              `/api/users/${stacksAddress}`
            );
            setUser({
              stacksAddress,
              profile: userData.profile as User['profile'],
              isPublic: (userData.isPublic as boolean) ?? true,
              hasPassport: !!userData.passportId,
              joinDate: userData.joinDate
                ? new Date(userData.joinDate as string)
                : undefined,
            });
            setIsAuthenticated(true);
          } catch (err: unknown) {
            if (err instanceof APIClientError && err.status === 404) {
              // User exists in wallet but not in backend – needs registration
              setUser({ stacksAddress, isPublic: true, hasPassport: false });
              setIsAuthenticated(true);
            } else {
              logger.error('Auth data fetch failed', { err });
              setError(
                'Failed to load your account data. Please refresh the page.'
              );
            }
          }
        }
      } catch (err: unknown) {
        logger.error('Auth check failed', { err });
        setError('Authentication check failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await showConnect({
        appDetails: {
          name: 'PassportX',
          icon: window.location.origin + '/logo.png',
        },
        redirectTo: '/',
        onFinish: async () => {
          try {
            const walletData = userSession.loadUserData();
            const stacksAddress =
              walletData.profile.stxAddress.testnet ||
              walletData.profile.stxAddress.mainnet;

            // Check if user exists in backend
            try {
              const userData = await apiClient.get<Record<string, unknown>>(
                `/api/users/${stacksAddress}`
              );
              setUser({
                stacksAddress,
                profile: userData.profile as User['profile'],
                isPublic: (userData.isPublic as boolean) ?? true,
                hasPassport: !!userData.passportId,
                joinDate: userData.joinDate
                  ? new Date(userData.joinDate as string)
                  : undefined,
              });
            } catch (err: unknown) {
              if (err instanceof APIClientError && err.status === 404) {
                // New user – trigger registration
                setUser({ stacksAddress, isPublic: true, hasPassport: false });
              } else {
                logger.error('Login backend check failed', { err });
                setError(
                  'Connected to wallet but failed to load account. Please refresh.'
                );
              }
            }

            setIsAuthenticated(true);
          } finally {
            setIsLoading(false);
          }
        },
        onCancel: () => {
          setIsLoading(false);
        },
        userSession,
      });
    } catch (err: unknown) {
      logger.error('Wallet connection failed', { err });
      setError('Wallet connection failed. Please try again.');
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);

    // Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.removeItem('passportx_session');
    }
  };

  const updateProfile = async (profileData: Partial<User['profile']>) => {
    if (!user) throw new Error('No user authenticated');

    try {
      await apiClient.put(
        `/api/users/${user.stacksAddress}/profile`,
        profileData
      );
      setUser({ ...user, profile: { ...user.profile, ...profileData } });
    } catch (err: unknown) {
      logger.error('Profile update failed', { err });
      throw err;
    }
  };

  const initializePassport = async () => {
    if (!user) throw new Error('No user authenticated');
    if (user.hasPassport) return;

    try {
      await apiClient.post('/api/passport/initialize', {
        stacksAddress: user.stacksAddress,
      });
      setUser({ ...user, hasPassport: true });
    } catch (err: unknown) {
      logger.error('Passport initialization failed', { err });
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    userSession,
    connectWallet,
    disconnectWallet,
    updateProfile,
    initializePassport,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
