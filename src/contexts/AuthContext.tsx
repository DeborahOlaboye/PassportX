'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

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
          const response = await fetch(`/api/users/${stacksAddress}`);
          if (response.ok) {
            const userData = await response.json();
            setUser({
              stacksAddress,
              profile: userData.data?.profile,
              isPublic: userData.data?.isPublic ?? true,
              hasPassport: !!userData.data?.passportId,
              joinDate: userData.data?.joinDate ? new Date(userData.data.joinDate) : undefined,
            });
            setIsAuthenticated(true);
          } else {
            // User exists in wallet but not in backend - needs registration
            setUser({
              stacksAddress,
              isPublic: true,
              hasPassport: false,
            });
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
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
          const response = await fetch(`/api/users/${stacksAddress}`);

          if (response.ok) {
            const userData = await response.json();
            setUser({
              stacksAddress,
              profile: userData.data?.profile,
              isPublic: userData.data?.isPublic ?? true,
              hasPassport: !!userData.data?.passportId,
              joinDate: userData.data?.joinDate ? new Date(userData.data.joinDate) : undefined,
            });
          } else {
            // New user - trigger registration
            setUser({
              stacksAddress,
              isPublic: true,
              hasPassport: false,
            });
          }

          setIsAuthenticated(true);
          setIsLoading(false);
        },
        onCancel: () => {
          setIsLoading(false);
        },
        userSession,
      });
    } catch (error) {
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
      const response = await fetch(`/api/users/${user.stacksAddress}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setUser({
          ...user,
          profile: {
            ...user.profile,
            ...profileData,
          },
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const initializePassport = async () => {
    if (!user) throw new Error('No user authenticated');
    if (user.hasPassport) return;

    try {
      const response = await fetch('/api/passport/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stacksAddress: user.stacksAddress,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          ...user,
          hasPassport: true,
        });
      } else {
        throw new Error('Failed to initialize passport');
      }
    } catch (error) {
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
