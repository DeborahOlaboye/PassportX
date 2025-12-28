/**
 * Auth demo component showing sign in/sign out flow.
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const AuthDemo: React.FC = () => {
  const { token, isAuthenticated, signIn, signOut, error } = useAuth();
  const [account, setAccount] = useState('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

  const handleSignIn = async () => {
    await signIn(account);
  };

  return (
    <div style={{ padding: 20 }}>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      {isAuthenticated && <div data-testid="auth-token">{token?.accessToken?.substring(0, 10)}...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
      <input
        type="text"
        value={account}
        onChange={(e) => setAccount(e.target.value)}
        placeholder="Account address"
        style={{ marginRight: 10 }}
      />
      {!isAuthenticated ? (
        <button onClick={handleSignIn} data-testid="sign-in-btn">
          Sign In
        </button>
      ) : (
        <button onClick={signOut} data-testid="sign-out-btn">
          Sign Out
        </button>
      )}
    </div>
  );
};

export default AuthDemo;
