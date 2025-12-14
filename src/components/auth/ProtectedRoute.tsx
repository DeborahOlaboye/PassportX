'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePassport?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requirePassport = false,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // Authenticated but passport required and not available
      if (requirePassport && !user?.hasPassport) {
        router.push('/onboarding');
        return;
      }
    }
  }, [isAuthenticated, isLoading, requirePassport, user, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated but passport required and not available
  if (requirePassport && !user?.hasPassport) {
    return null;
  }

  // All checks passed - render children
  return <>{children}</>;
}
