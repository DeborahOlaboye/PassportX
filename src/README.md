# PassportX Frontend Application

This is the user-facing web application for PassportX, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### ✅ Completed (Issue #3)

- **Next.js Application Setup**: Modern React framework with TypeScript
- **User Passport UI**: Badge grid with search and filtering
- **Community Admin Dashboard**: Manage communities and view statistics
- **Badge Creation Interface**: Comprehensive form with preview
- **Wallet Connection**: Stacks blockchain integration
- **Public Passport Sharing**: SEO-optimized public pages
- **Responsive Design**: Mobile-first approach with responsive components
- **Error Handling**: Comprehensive error boundaries and loading states

## Project Structure

```
src/
├── app/                    # Next.js 14 app directory
│   ├── admin/             # Admin dashboard pages
│   ├── passport/          # User passport pages
│   ├── public/            # Public sharing pages
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Homepage
│   ├── loading.tsx        # Global loading page
│   ├── error.tsx          # Global error page
│   └── not-found.tsx      # 404 page
├── components/            # Reusable React components
│   ├── forms/             # Form components
│   ├── BadgeCard.tsx      # Individual badge display
│   ├── BadgeGrid.tsx      # Badge collection with filtering
│   ├── CommunityCard.tsx  # Community management card
│   ├── Header.tsx         # Main navigation header
│   ├── MobileMenu.tsx     # Mobile navigation
│   ├── WalletConnect.tsx  # Stacks wallet integration
│   ├── LoadingSpinner.tsx # Loading UI component
│   └── ErrorBoundary.tsx  # Error handling component
└── lib/                   # Utility functions and configurations
    ├── api.ts             # API utilities and interfaces
    ├── stacks.ts          # Stacks blockchain configuration
    └── utils.ts           # General utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Stacks wallet (for testing)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment configuration:
   ```bash
   cp .env.local.example .env.local
   ```

4. Update environment variables in `.env.local`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Key Components

### User Experience
- **Passport View**: Personal badge collection with filtering and search
- **Public Sharing**: SEO-optimized public passport pages
- **Responsive Design**: Works seamlessly on desktop and mobile

### Admin Experience  
- **Dashboard**: Overview of communities and statistics
- **Badge Creation**: Intuitive form with real-time preview
- **Community Management**: Create and manage badge-issuing communities

### Technical Features
- **Wallet Integration**: Stacks Connect for blockchain authentication
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: Smooth loading experiences throughout the app
- **TypeScript**: Full type safety and developer experience

## Environment Variables

See `.env.local.example` for required configuration:

- `NEXT_PUBLIC_STACKS_NETWORK`: testnet or mainnet
- `NEXT_PUBLIC_STACKS_API_URL`: Stacks API endpoint
- Contract addresses (set after deployment)

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run test`: Run test suite

## Integration with Smart Contracts

The frontend is designed to integrate with the PassportX smart contracts:

- **passport-core.clar**: Main passport functionality
- **badge-issuer.clar**: Badge creation and minting
- **community-manager.clar**: Community management

API utilities in `src/lib/api.ts` provide the interface for blockchain interactions.

## Deployment

The application is ready for deployment on platforms like:

- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Any Node.js hosting platform

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for new features
3. Include responsive design considerations
4. Test on both desktop and mobile
5. Update documentation for new features

## License

MIT License - see LICENSE file for details