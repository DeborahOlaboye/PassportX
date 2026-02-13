'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { apiClient, APIClientError } from '@/lib/api-client';

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

  // Check if user is already signed in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (userSession.isUserSignedIn()) {
          const userData = userSession.loadUserData();
          const stacksAddress = userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;

          // Fetch user data from backend
          try {
            const userData = await apiClient.get<any>(`/api/users/${stacksAddress}`);
            setUser({
              stacksAddress,
              profile: userData.profile,
              isPublic: userData.isPublic ?? true,
              hasPassport: !!userData.passportId,
              joinDate: userData.joinDate ? new Date(userData.joinDate) : undefined,
            });
            setIsAuthenticated(true);
          } catch (error: unknown) {
            if (error instanceof APIClientError && error.status === 404) {
              // User exists in wallet but not in backend - needs registration
              setUser({
                stacksAddress,
                isPublic: true,
                hasPassport: false,
              });
              setIsAuthenticated(true);
            } else {
              console.error('Auth data fetch failed:', error);
            }
          }
        }
      } catch (error: unknown) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const connectWallet = async () => {
    try {
      setIsLoading(true);

      await showConnect({
        appDetails: {
          name: 'PassportX',
          icon: window.location.origin + '/logo.png',
        },
        redirectTo: '/',
        onFinish: async () => {
          const userData = userSession.loadUserData();
          const stacksAddress = userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;

          // Check if user exists in backend
          try {
            const userData = await apiClient.get<any>(`/api/users/${stacksAddress}`);
            setUser({
              stacksAddress,
              profile: userData.profile,
              isPublic: userData.isPublic ?? true,
              hasPassport: !!userData.passportId,
              joinDate: userData.joinDate ? new Date(userData.joinDate) : undefined,
            });
          } catch (error: unknown) {
            if (error instanceof APIClientError && error.status === 404) {
              // New user - trigger registration
              setUser({
                stacksAddress,
                isPublic: true,
                hasPassport: false,
              });
            } else {
              console.error('Login backend check failed:', error);
            }
          }

          setIsAuthenticated(true);
          setIsLoading(false);
        },
        onCancel: () => {
          setIsLoading(false);
        },
        userSession,
      });
    } catch (error: unknown) {
      console.error('Wallet connection failed:', error);
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
    setUser(null);
    setIsAuthenticated(false);

    // Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.removeItem('passportx_session');
    }
  };

  const updateProfile = async (profileData: Partial<User['profile']>) => {
    if (!user) throw new Error('No user authenticated');

    try {
      await apiClient.put(`/api/users/${user.stacksAddress}/profile`, profileData);
      
      setUser({
        ...user,
        profile: {
          ...user.profile,
          ...profileData,
        },
      });
    } catch (error: unknown) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const initializePassport = async () => {
    if (!user) throw new Error('No user authenticated');
    if (user.hasPassport) return;

    try {
      await apiClient.post('/api/passport/initialize', {
        stacksAddress: user.stacksAddress,
      });

      setUser({
        ...user,
        hasPassport: true,
      });
    } catch (error: unknown) {
      console.error('Passport initialization failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
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
