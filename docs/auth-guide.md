# Message Signing & Authentication Guide

## Overview

This guide covers the message signing and authentication features added in Issue #76. These utilities enable users to sign messages with their wallet, verify signatures, and manage authentication tokens securely.

## Key Concepts

### Message Signing
Users can sign arbitrary messages with their wallet. Messages include:
- **Domain**: Identifier for your application (prevents cross-application signature reuse)
- **Timestamp**: Prevents replay attacks by enforcing time windows
- **Data**: The actual content being signed

### Signature Verification
Signatures are verified against the original message and checked for expiration. Invalid or expired signatures are rejected.

### Token Management
Authentication tokens are generated from verified signatures and can be stored securely with optional encryption.

## Core Components

### 1. Message Signing (`src/utils/messageSigning.ts`)

Create and format messages for signing:

```typescript
import { createAuthMessage, formatMessageForSigning } from '../utils/messageSigning';

const message = createAuthMessage({
  domain: 'myapp.com',
  data: 'user-login-request',
  timestamp: Date.now()
});

const formattedMessage = formatMessageForSigning(message);
// User signs formattedMessage with their wallet
```

### 2. Signature Verification (`src/utils/signatureVerification.ts`)

Verify signatures and check expiration:

```typescript
import { verifySignature, isSignatureExpired } from '../utils/signatureVerification';

const isValid = verifySignature(signature, originalMessage, publicKey);
const isExpired = isSignatureExpired(signature, 300); // 5 minute window

if (isValid && !isExpired) {
  // Proceed with authentication
}
```

### 3. Token Storage (`src/utils/tokenStorage.ts`)

Securely store and retrieve auth tokens:

```typescript
import { 
  saveToken, 
  retrieveToken, 
  clearToken,
  encryptToken,
  decryptToken 
} from '../utils/tokenStorage';

// Save token (with optional encryption)
await saveToken(token, 'auth-token', true); // encrypt=true

// Retrieve token
const token = await retrieveToken('auth-token');

// Clear token
clearToken('auth-token');
```

### 4. Session Tokens (`src/utils/sessionTokens.ts`)

Generate and validate session tokens:

```typescript
import { generateSessionToken, validateSessionToken } from '../utils/sessionTokens';

const token = generateSessionToken(); // Random cryptographic token
const isValid = validateSessionToken(token);
```

### 5. Auth Context (`src/context/AuthContext.tsx`)

React context for global auth state management:

```typescript
import { AuthProvider } from '../context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourComponents />
    </AuthProvider>
  );
}
```

### 6. useAuth Hook (`src/hooks/useAuth.tsx`)

Consume auth state in components:

```typescript
import { useAuth } from '../hooks/useAuth';

function LoginComponent() {
  const { 
    isAuthenticated, 
    signIn, 
    signOut, 
    token,
    isVerifying,
    error 
  } = useAuth();

  const handleSignIn = async () => {
    await signIn(signature, originalMessage);
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Authenticated</p>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <button onClick={handleSignIn}>Sign In</button>
      )}
    </div>
  );
}
```

## Authentication Flow

1. **Message Creation**: Create a domain-specific message with timestamp
2. **User Signs**: User signs message with their wallet (private key stays with wallet)
3. **Verification**: Verify signature against public key and check expiration
4. **Token Generation**: Generate session token from verified signature
5. **Token Storage**: Securely store token with optional encryption
6. **Token Validation**: On subsequent requests, validate stored token

## Security Considerations

### Private Key Safety
- ✅ **Private keys never leave the user's wallet** - signing happens in wallet software
- ✅ Only signatures are transmitted to your backend
- ✅ Implement verification on backend to prevent replay attacks

### Replay Attack Prevention
- Use **domain** to scope signatures to your application
- Use **timestamp** with reasonable expiration windows (e.g., 5 minutes for login)
- Each message includes both domain and timestamp

### Token Encryption
Optional encryption is available for stored tokens:

```typescript
// With encryption
await saveToken(token, 'auth-token', true);
const decrypted = await retrieveToken('auth-token');

// Without encryption
await saveToken(token, 'auth-token', false);
```

### Storage Selection
Choose storage based on security needs:
- **localStorage**: Persistent across browser restarts (lower security)
- **sessionStorage**: Cleared when tab closes (higher security)
- **In-memory**: Lost on page reload (highest security, requires re-auth)

## Type Definitions

### AuthToken

```typescript
interface AuthToken {
  signature: string;
  publicKey: string;
  message: string;
  timestamp: number;
  domain: string;
  expiresAt: number;
  sessionToken: string;
}
```

### AuthSession

```typescript
interface AuthSession {
  token: AuthToken;
  isAuthenticated: boolean;
  lastVerified: number;
  expiresIn(maxAge?: number): number;
  isExpired(maxAge?: number): boolean;
}
```

## Error Handling

The auth context includes error states:

```typescript
const { error, isVerifying, signIn } = useAuth();

try {
  await signIn(signature, message);
} catch (err) {
  if (err.message.includes('expired')) {
    // Token expired - require re-authentication
  } else if (err.message.includes('invalid')) {
    // Invalid signature - reject
  }
}
```

## Testing

Comprehensive tests are included:
- `tests/unit/messageSigning.test.ts` - Message creation and formatting
- `tests/unit/tokenManagement.test.ts` - Token generation and validation
- `tests/unit/authContext.test.ts` - Context provider and hooks

Run tests:
```bash
npm test tests/unit/messageSigning.test.ts
npm test tests/unit/tokenManagement.test.ts
npm test tests/unit/authContext.test.ts
```

## Demo Component

See `src/components/AuthDemo.tsx` for a complete working example of authentication UI.

## Integration with WalletConnect

This auth system integrates with the WalletConnect session management:

```typescript
import { useWalletSession } from '../hooks/useWalletSession';
import { useAuth } from '../hooks/useAuth';

function AuthenticatedWalletComponent() {
  const { wallet, isConnected } = useWalletSession();
  const { isAuthenticated, signIn } = useAuth();

  const handleWalletAuth = async () => {
    if (isConnected && wallet) {
      // Use wallet.publicKey for signature verification
      const message = createAuthMessage({ /* ... */ });
      await signIn(signature, message);
    }
  };

  return (
    <div>
      {isConnected && !isAuthenticated && (
        <button onClick={handleWalletAuth}>Authenticate</button>
      )}
    </div>
  );
}
```

## Troubleshooting

### Token Verification Fails
- Check that domain matches on both signing and verification
- Verify timestamp is within acceptable window
- Ensure signature matches original message exactly

### Encryption Issues
- Verify Web Crypto API is available in browser
- Check that keys are properly initialized
- Ensure encoded/decoded token format matches

### Storage Issues
- Check browser console for localStorage/sessionStorage restrictions
- Verify storage quota is not exceeded
- For localStorage: ensure keys don't collide with other apps

## Next Steps

- Implement backend verification endpoint to validate signatures
- Add token refresh mechanisms for long-lived sessions
- Integrate with your identity provider for additional claims
- Consider adding biometric verification as additional factor
