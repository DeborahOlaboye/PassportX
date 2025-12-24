# WalletConnect Setup Guide

Complete setup instructions for integrating WalletConnect into PassportX.

## Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- WalletConnect Project ID ([get one here](https://dashboard.walletconnect.com))

## Step 1: Install Dependencies

All WalletConnect dependencies have been installed. Verify the installation:

```bash
npm run verify-deps
```

Expected output:
```
✅ All required dependencies are properly installed!

You can now run:
  npm run dev       - Start development server
  npm run build     - Build for production
  npm test          - Run tests
```

## Step 2: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Add your WalletConnect Project ID to `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_WALLETCONNECT_RELAY_URL=wss://relay.walletconnect.org
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Verify Configuration

Run the verification script to ensure everything is set up correctly:

```bash
npm run verify-deps
```

## Step 4: Start Development Server

```bash
npm run dev
```

The application should start on `http://localhost:3000`.

## Step 5: Test WalletConnect Integration

1. Navigate to the application
2. Look for the "Connect Wallet" button in the header
3. Click to open the wallet selector modal
4. Verify you can:
   - See wallet options (Xverse, Hiro, Leather)
   - View QR code for mobile connections
   - Copy connection URI

## Installed Packages

### Core WalletConnect (Required)

| Package | Version | Purpose |
|---------|---------|---------|
| @reown/walletkit | ^1.4.1 | Main WalletConnect wallet SDK |
| @walletconnect/core | ^2.23.1 | Core WalletConnect protocol |
| @walletconnect/utils | ^2.23.1 | Utility functions |

### Supporting Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| qrcode | ^1.5.4 | QR code generation |
| @metamask/eth-sig-util | ^8.2.0 | Signature utilities |
| zustand | ^5.0.9 | State management |
| axios | ^1.13.2 | HTTP client |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| @types/qrcode | ^1.5.6 | TypeScript types |

## Troubleshooting

### Issue: "Cannot find module '@reown/walletkit'"

**Solution:**
```bash
npm install @reown/walletkit --save
npm run verify-deps
```

### Issue: WalletConnect fails to initialize

**Solution:**
1. Check that `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set in `.env.local`
2. Verify the Project ID is valid
3. Check browser console for errors
4. Clear browser cache and reload

### Issue: "Relay server is unreachable"

**Solution:**
```bash
# Use fallback relay URL
NEXT_PUBLIC_WALLETCONNECT_RELAY_URL=wss://relay.walletconnect.com
```

### Issue: TypeScript errors

**Solution:**
```bash
# Ensure all type definitions are installed
npm install --save-dev @types/qrcode
npm install --save @walletconnect/utils
```

### Issue: npm audit warnings

**Solution:**
```bash
# View vulnerabilities
npm audit

# Fix non-breaking vulnerabilities
npm audit fix

# Review critical issues before fixing with --force
npm audit fix --force
```

## Post-Installation Steps

### 1. Update Environment Configuration

Ensure all WalletConnect variables are configured in your `.env.local`:

```env
# Required
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_project_id>

# Optional (defaults provided)
NEXT_PUBLIC_WALLETCONNECT_RELAY_URL=wss://relay.walletconnect.org
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WALLETCONNECT_DEBUG=false
```

### 2. Add Provider to Your App

In your root layout (`src/app/layout.tsx`):

```tsx
import { EnhancedWalletProvider } from '@/components/wallet'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <EnhancedWalletProvider debug={process.env.NODE_ENV === 'development'}>
          {children}
        </EnhancedWalletProvider>
      </body>
    </html>
  )
}
```

### 3. Add Connect Button to Header

In your header component:

```tsx
import { ConnectButton, AccountDisplay } from '@/components/wallet'

export function Header() {
  return (
    <header>
      <div className="flex items-center justify-between">
        <div>Logo</div>
        <div>
          <AccountDisplay />
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
```

### 4. Test the Connection

1. Start the dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. Click "Connect Wallet"
4. Select a wallet or scan QR code
5. Verify connection succeeds

## Creating Your WalletConnect Project

1. Go to [WalletConnect Dashboard](https://dashboard.walletconnect.com)
2. Sign up or log in
3. Create a new project
4. Copy your Project ID
5. Add it to `.env.local`:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_here
   ```

## Next Steps

- [WalletConnect Provider Setup](./WALLETCONNECT_PROVIDER_SETUP.md)
- [WalletConnect Integration Guide](./WALLETCONNECT_INTEGRATION.md)
- [Dependency Management](./DEPENDENCY_MANAGEMENT.md)

## Support

- [WalletConnect Docs](https://docs.walletconnect.network/)
- [WalletConnect Discord](https://discord.walletconnect.network/)
- [Project Issues](https://github.com/DeborahOlaboye/PassportX/issues)

## Verification Checklist

- [ ] Node.js version 16+ installed
- [ ] All dependencies installed (`npm install`)
- [ ] `verify-deps` script passes
- [ ] `.env.local` configured with Project ID
- [ ] Development server starts (`npm run dev`)
- [ ] Connect Wallet button visible in header
- [ ] Can click Connect button and see wallet options
- [ ] QR code displays for mobile connections
- [ ] No errors in browser console
